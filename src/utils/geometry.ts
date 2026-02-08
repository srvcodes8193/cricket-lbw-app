import {Point2D, Point3D, CalibrationData, CRICKET_CONSTANTS} from '../types';

/**
 * Calculate homography matrix from calibration points
 * This transforms screen coordinates to pitch coordinates
 */
export function calculateHomography(calibration: CalibrationData): number[][] | null {
  // Simplified homography for MVP
  // In a real implementation, use proper 3x3 homography matrix calculation

  if (!calibration.stumpsBottomLeft || !calibration.stumpsBottomRight) {
    return null;
  }

  // Calculate scale based on stump width in pixels vs real width
  const pixelWidth = Math.abs(
    calibration.stumpsBottomRight.x - calibration.stumpsBottomLeft.x
  );
  const realWidth = CRICKET_CONSTANTS.STUMP_WIDTH;
  const scale = realWidth / pixelWidth;

  // Calculate center point (middle stump position)
  const centerX = (calibration.stumpsBottomLeft.x + calibration.stumpsBottomRight.x) / 2;
  const centerY = calibration.stumpsBottomLeft.y;

  // Return simplified transformation parameters
  return [
    [scale, 0, -centerX * scale],
    [0, scale, -centerY * scale],
    [0, 0, 1],
  ];
}

/**
 * Transform screen point to world coordinates using homography
 */
export function screenToWorld(
  point: Point2D,
  homography: number[][] | null,
  estimatedZ: number = 0
): Point3D {
  if (!homography) {
    // Return identity transform if no calibration
    return {x: point.x / 1000, y: point.y / 1000, z: estimatedZ};
  }

  const [h0, h1, h2] = homography;

  // Apply homography transformation
  const w = h2[0] * point.x + h2[1] * point.y + h2[2];
  const x = (h0[0] * point.x + h0[1] * point.y + h0[2]) / w;
  const y = (h1[0] * point.x + h1[1] * point.y + h1[2]) / w;

  return {x, y, z: estimatedZ};
}

/**
 * Transform world coordinates to screen point
 */
export function worldToScreen(
  point: Point3D,
  homography: number[][] | null
): Point2D {
  if (!homography) {
    return {x: point.x * 1000, y: point.y * 1000};
  }

  // Inverse homography (simplified)
  const scale = homography[0][0];
  const offsetX = homography[0][2];
  const offsetY = homography[1][2];

  return {
    x: (point.x - offsetX) / scale,
    y: (point.y - offsetY) / scale,
  };
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

/**
 * Calculate distance between two 2D points
 */
export function distance2D(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Interpolate between two points
 */
export function lerp3D(p1: Point3D, p2: Point3D, t: number): Point3D {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
    z: p1.z + (p2.z - p1.z) * t,
  };
}

/**
 * Check if a point is within stump bounds
 */
export function isWithinStumps(point: Point3D): boolean {
  const {OFF_STUMP, LEG_STUMP, STUMP_HEIGHT} = CRICKET_CONSTANTS;

  return (
    point.x >= OFF_STUMP &&
    point.x <= LEG_STUMP &&
    point.z >= 0 &&
    point.z <= STUMP_HEIGHT
  );
}

/**
 * Check if point is within umpire's call zone
 */
export function isInUmpiresCallZone(point: Point3D): boolean {
  const {OFF_STUMP, LEG_STUMP, STUMP_HEIGHT, UMPIRES_CALL_MARGIN} = CRICKET_CONSTANTS;

  const innerOff = OFF_STUMP + UMPIRES_CALL_MARGIN;
  const innerLeg = LEG_STUMP - UMPIRES_CALL_MARGIN;
  const innerTop = STUMP_HEIGHT - UMPIRES_CALL_MARGIN;

  // Inside stump zone but within margin
  const withinStumps = isWithinStumps(point);
  const withinInner = (
    point.x >= innerOff &&
    point.x <= innerLeg &&
    point.z >= UMPIRES_CALL_MARGIN &&
    point.z <= innerTop
  );

  return withinStumps && !withinInner;
}

/**
 * Estimate ball height from its apparent size in pixels
 */
export function estimateHeightFromSize(
  apparentDiameterPixels: number,
  calibration: CalibrationData
): number {
  // When ball is at ground level, it has a known size
  // As it gets higher (closer to camera at ground level), it appears larger

  // This is a simplified model - real implementation would need proper camera calibration
  const referenceSize = 20; // pixels at ground level
  const sizeRatio = apparentDiameterPixels / referenceSize;

  // Estimate height based on size ratio (larger = closer = higher)
  return Math.max(0, (sizeRatio - 1) * 0.5);
}
