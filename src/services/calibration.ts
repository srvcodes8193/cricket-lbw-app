import AsyncStorage from '@react-native-async-storage/async-storage';
import {CalibrationData, Point2D, CRICKET_CONSTANTS} from '../types';
import {calculateHomography} from '../utils/geometry';

const CALIBRATION_STORAGE_KEY = '@cricket_lbw_calibration';

/**
 * Calibration Service
 * Manages pitch calibration for coordinate transformation
 */

/**
 * Default calibration (uncalibrated state)
 */
export function getDefaultCalibration(): CalibrationData {
  return {
    stumpsTopLeft: {x: 0, y: 0},
    stumpsTopRight: {x: 0, y: 0},
    stumpsBottomLeft: {x: 0, y: 0},
    stumpsBottomRight: {x: 0, y: 0},
    creaseLeft: {x: 0, y: 0},
    creaseRight: {x: 0, y: 0},
    homography: null,
    isCalibrated: false,
  };
}

/**
 * Create calibration from stump corner points
 */
export function createCalibration(
  stumpsTopLeft: Point2D,
  stumpsTopRight: Point2D,
  stumpsBottomLeft: Point2D,
  stumpsBottomRight: Point2D,
  creaseLeft?: Point2D,
  creaseRight?: Point2D
): CalibrationData {
  const calibration: CalibrationData = {
    stumpsTopLeft,
    stumpsTopRight,
    stumpsBottomLeft,
    stumpsBottomRight,
    creaseLeft: creaseLeft || {x: stumpsBottomLeft.x - 100, y: stumpsBottomLeft.y},
    creaseRight: creaseRight || {x: stumpsBottomRight.x + 100, y: stumpsBottomRight.y},
    homography: null,
    isCalibrated: false,
  };

  // Calculate homography matrix
  calibration.homography = calculateHomography(calibration);
  calibration.isCalibrated = calibration.homography !== null;

  return calibration;
}

/**
 * Create a quick calibration from just the stump base position
 * Useful for simpler setup
 */
export function createQuickCalibration(
  stumpCenter: Point2D,
  stumpWidthPixels: number,
  stumpHeightPixels: number
): CalibrationData {
  const halfWidth = stumpWidthPixels / 2;
  const halfHeight = stumpHeightPixels / 2;

  return createCalibration(
    {x: stumpCenter.x - halfWidth, y: stumpCenter.y - halfHeight},
    {x: stumpCenter.x + halfWidth, y: stumpCenter.y - halfHeight},
    {x: stumpCenter.x - halfWidth, y: stumpCenter.y + halfHeight},
    {x: stumpCenter.x + halfWidth, y: stumpCenter.y + halfHeight}
  );
}

/**
 * Validate calibration points
 */
export function validateCalibration(calibration: CalibrationData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that all points are set
  const points = [
    {name: 'Stumps Top Left', point: calibration.stumpsTopLeft},
    {name: 'Stumps Top Right', point: calibration.stumpsTopRight},
    {name: 'Stumps Bottom Left', point: calibration.stumpsBottomLeft},
    {name: 'Stumps Bottom Right', point: calibration.stumpsBottomRight},
  ];

  for (const {name, point} of points) {
    if (!point || (point.x === 0 && point.y === 0)) {
      errors.push(`${name} not set`);
    }
  }

  // Check that points form a reasonable rectangle
  if (errors.length === 0) {
    const width = Math.abs(
      calibration.stumpsBottomRight.x - calibration.stumpsBottomLeft.x
    );
    const height = Math.abs(
      calibration.stumpsBottomLeft.y - calibration.stumpsTopLeft.y
    );

    if (width < 10) {
      errors.push('Stump width too small');
    }
    if (height < 10) {
      errors.push('Stump height too small');
    }

    // Check aspect ratio (should be roughly 1:3 for stumps)
    const aspectRatio = height / width;
    if (aspectRatio < 1.5 || aspectRatio > 5) {
      errors.push('Stump aspect ratio seems incorrect');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Save calibration to persistent storage
 */
export async function saveCalibration(calibration: CalibrationData): Promise<void> {
  try {
    const jsonValue = JSON.stringify(calibration);
    await AsyncStorage.setItem(CALIBRATION_STORAGE_KEY, jsonValue);
  } catch (error) {
    console.error('Failed to save calibration:', error);
    throw error;
  }
}

/**
 * Load calibration from persistent storage
 */
export async function loadCalibration(): Promise<CalibrationData | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (jsonValue === null) {
      return null;
    }
    return JSON.parse(jsonValue) as CalibrationData;
  } catch (error) {
    console.error('Failed to load calibration:', error);
    return null;
  }
}

/**
 * Clear saved calibration
 */
export async function clearCalibration(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CALIBRATION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear calibration:', error);
    throw error;
  }
}

/**
 * Get stump zone boundaries in screen coordinates
 */
export function getStumpZoneBounds(calibration: CalibrationData): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} | null {
  if (!calibration.isCalibrated) {
    return null;
  }

  return {
    left: Math.min(calibration.stumpsTopLeft.x, calibration.stumpsBottomLeft.x),
    right: Math.max(calibration.stumpsTopRight.x, calibration.stumpsBottomRight.x),
    top: Math.min(calibration.stumpsTopLeft.y, calibration.stumpsTopRight.y),
    bottom: Math.max(calibration.stumpsBottomLeft.y, calibration.stumpsBottomRight.y),
  };
}

/**
 * Get calibration guide text for user
 */
export function getCalibrationInstructions(): string[] {
  return [
    'Position your phone at ground level, facing the stumps',
    'Make sure all three stumps are visible in the frame',
    'Tap the four corners of the stumps (top-left, top-right, bottom-left, bottom-right)',
    'Optionally mark the crease line',
    'Ensure good lighting and steady camera position',
  ];
}

/**
 * Estimate if calibration quality is good enough
 */
export function estimateCalibrationQuality(calibration: CalibrationData): {
  quality: 'good' | 'fair' | 'poor';
  score: number;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 100;

  if (!calibration.isCalibrated) {
    return {quality: 'poor', score: 0, suggestions: ['Complete calibration']};
  }

  // Check stump size in pixels
  const stumpWidth =
    calibration.stumpsBottomRight.x - calibration.stumpsBottomLeft.x;
  const stumpHeight =
    calibration.stumpsBottomLeft.y - calibration.stumpsTopLeft.y;

  if (stumpWidth < 30) {
    score -= 20;
    suggestions.push('Stumps appear too small - move closer');
  }

  if (stumpHeight < 100) {
    score -= 20;
    suggestions.push('Stumps too short in frame - adjust camera angle');
  }

  // Check symmetry
  const topWidth = calibration.stumpsTopRight.x - calibration.stumpsTopLeft.x;
  const widthDiff = Math.abs(topWidth - stumpWidth);
  if (widthDiff > 20) {
    score -= 15;
    suggestions.push('Stumps appear skewed - align camera perpendicular');
  }

  // Determine quality level
  let quality: 'good' | 'fair' | 'poor';
  if (score >= 80) {
    quality = 'good';
  } else if (score >= 50) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return {quality, score, suggestions};
}
