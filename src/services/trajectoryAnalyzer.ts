import {
  BallDetection,
  TrackedPosition,
  Trajectory,
  Point3D,
  CalibrationData,
  CRICKET_CONSTANTS,
} from '../types';
import {screenToWorld} from '../utils/geometry';
import {
  fitTrajectory,
  positionAtTime,
  findPitchPoint,
  projectToStumps,
  velocityAtTime,
  TrajectoryCoefficients,
} from '../utils/physics';

/**
 * Trajectory Analyzer Service
 * Processes ball detections and calculates trajectory, pitch point, impact, and projection
 */

// Minimum detections needed for trajectory analysis
const MIN_DETECTIONS = 5;

// Maximum time gap between detections (ms)
const MAX_TIME_GAP = 200;

/**
 * Estimate ball height from screen position and calibration
 * Simplified model for MVP
 */
function estimateBallHeight(
  screenY: number,
  screenHeight: number,
  distanceFromStumps: number
): number {
  // Higher on screen = higher ball (when camera is at ground level)
  // Also affected by distance from stumps

  const normalizedY = 1 - screenY / screenHeight; // 0 = bottom, 1 = top
  const baseHeight = normalizedY * 2; // Max ~2 meters

  // Adjust for distance (further = higher on screen for same height)
  const distanceAdjustment = distanceFromStumps / CRICKET_CONSTANTS.PITCH_LENGTH;

  return Math.max(0, baseHeight - distanceAdjustment);
}

/**
 * Convert ball detections to tracked positions with world coordinates
 */
export function convertToTrackedPositions(
  detections: BallDetection[],
  calibration: CalibrationData,
  screenHeight: number = 1920
): TrackedPosition[] {
  return detections.map((detection, index) => {
    // Estimate distance from stumps based on detection order
    // Earlier detections = further from stumps
    const progress = index / Math.max(detections.length - 1, 1);
    const distanceFromStumps =
      CRICKET_CONSTANTS.PITCH_LENGTH * (1 - progress * 0.9); // 20m to 2m

    // Estimate height
    const estimatedZ = estimateBallHeight(
      detection.position.y,
      screenHeight,
      distanceFromStumps
    );

    // Convert to world coordinates
    const worldPosition = screenToWorld(
      detection.position,
      calibration.homography,
      estimatedZ
    );

    // Override y with estimated distance for MVP
    worldPosition.y = distanceFromStumps;

    return {
      screenPosition: detection.position,
      worldPosition,
      timestamp: detection.timestamp,
    };
  });
}

/**
 * Find the pitch point (where ball bounces)
 * Look for sudden change in vertical velocity
 */
function findPitchPointFromPositions(positions: TrackedPosition[]): Point3D | null {
  if (positions.length < 3) return null;

  // Find point where z is closest to 0 after initial descent
  let minZ = Infinity;
  let pitchIndex = -1;

  // Skip first 30% (before pitch)
  const startIndex = Math.floor(positions.length * 0.3);

  for (let i = startIndex; i < positions.length; i++) {
    const z = positions[i].worldPosition.z;
    if (z < minZ && z >= 0) {
      minZ = z;
      pitchIndex = i;
    }
  }

  if (pitchIndex === -1) return null;

  return positions[pitchIndex].worldPosition;
}

/**
 * Find the impact point (where ball hits pad)
 * For MVP, use last detection point
 */
function findImpactPointFromPositions(positions: TrackedPosition[]): Point3D | null {
  if (positions.length === 0) return null;

  // Last position is assumed to be impact
  return positions[positions.length - 1].worldPosition;
}

/**
 * Analyze ball trajectory from detections
 */
export function analyzeTrajectory(
  detections: BallDetection[],
  calibration: CalibrationData,
  screenHeight: number = 1920
): Trajectory | null {
  if (detections.length < MIN_DETECTIONS) {
    console.log(
      `Insufficient detections: ${detections.length} < ${MIN_DETECTIONS}`
    );
    return null;
  }

  // Filter out detections with large time gaps
  const filteredDetections = filterByTimeGap(detections);

  if (filteredDetections.length < MIN_DETECTIONS) {
    console.log('Too many gaps in detections');
    return null;
  }

  // Convert to tracked positions
  const positions = convertToTrackedPositions(
    filteredDetections,
    calibration,
    screenHeight
  );

  // Find key points
  const pitchPoint = findPitchPointFromPositions(positions);
  const impactPoint = findImpactPointFromPositions(positions);

  // Fit trajectory
  const coefficients = fitTrajectory(positions);

  // Project path to stumps
  let projectedPath: Point3D[] = [];

  if (impactPoint && coefficients) {
    // Get velocity at impact
    const impactTime =
      (impactPoint.y / CRICKET_CONSTANTS.PITCH_LENGTH) * 1.5; // Estimate time
    const velocity = velocityAtTime(coefficients, impactTime);

    // Project to stumps
    projectedPath = projectToStumps(impactPoint, {vx: velocity.vx, vz: velocity.vz});
  } else if (impactPoint) {
    // Simple linear projection if no trajectory fit
    projectedPath = simpleProjection(impactPoint);
  }

  // Get release point (first position)
  const releasePoint = positions.length > 0 ? positions[0].worldPosition : null;

  return {
    positions,
    releasePoint,
    pitchPoint,
    impactPoint,
    projectedPath,
  };
}

/**
 * Filter detections removing those with large time gaps
 */
function filterByTimeGap(detections: BallDetection[]): BallDetection[] {
  if (detections.length === 0) return [];

  const result: BallDetection[] = [detections[0]];

  for (let i = 1; i < detections.length; i++) {
    const gap = detections[i].timestamp - detections[i - 1].timestamp;
    if (gap <= MAX_TIME_GAP) {
      result.push(detections[i]);
    }
  }

  return result;
}

/**
 * Simple linear projection when trajectory fit fails
 */
function simpleProjection(impactPoint: Point3D): Point3D[] {
  const path: Point3D[] = [];
  const numPoints = 20;

  // Assume ball continues roughly straight towards stumps
  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    path.push({
      x: impactPoint.x,
      y: impactPoint.y * (1 - progress),
      z: impactPoint.z * (1 - progress * 0.3), // Slight drop
    });
  }

  return path;
}

/**
 * Get the stump intersection point from projected path
 */
export function getStumpIntersection(projectedPath: Point3D[]): Point3D | null {
  if (projectedPath.length === 0) return null;

  // Find point where y is closest to 0 (stump plane)
  let closestPoint: Point3D | null = null;
  let minY = Infinity;

  for (const point of projectedPath) {
    if (Math.abs(point.y) < minY) {
      minY = Math.abs(point.y);
      closestPoint = point;
    }
  }

  return closestPoint;
}

/**
 * Calculate trajectory statistics
 */
export function getTrajectoryStats(trajectory: Trajectory): {
  totalDistance: number;
  duration: number;
  avgSpeed: number;
} {
  const positions = trajectory.positions;

  if (positions.length < 2) {
    return {totalDistance: 0, duration: 0, avgSpeed: 0};
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < positions.length; i++) {
    const p1 = positions[i - 1].worldPosition;
    const p2 = positions[i].worldPosition;
    const dist = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        Math.pow(p2.z - p1.z, 2)
    );
    totalDistance += dist;
  }

  // Calculate duration
  const duration =
    (positions[positions.length - 1].timestamp - positions[0].timestamp) / 1000;

  // Calculate average speed
  const avgSpeed = duration > 0 ? (totalDistance / duration) * 3.6 : 0; // km/h

  return {totalDistance, duration, avgSpeed};
}
