import {Point3D, TrackedPosition, CRICKET_CONSTANTS} from '../types';

const GRAVITY = 9.81; // m/s^2

/**
 * Fit a quadratic trajectory to a set of points
 * Returns coefficients for x(t), y(t), z(t)
 */
export interface TrajectoryCoefficients {
  // x(t) = ax*t + bx
  ax: number;
  bx: number;
  // y(t) = ay*t + by
  ay: number;
  by: number;
  // z(t) = az*t^2 + bz*t + cz (includes gravity)
  az: number;
  bz: number;
  cz: number;
}

/**
 * Fit trajectory to tracked positions using least squares
 */
export function fitTrajectory(
  positions: TrackedPosition[]
): TrajectoryCoefficients | null {
  if (positions.length < 3) {
    return null;
  }

  // Normalize timestamps to start from 0
  const startTime = positions[0].timestamp;
  const times = positions.map(p => (p.timestamp - startTime) / 1000); // Convert to seconds

  // Extract coordinates
  const xs = positions.map(p => p.worldPosition.x);
  const ys = positions.map(p => p.worldPosition.y);
  const zs = positions.map(p => p.worldPosition.z);

  // Fit linear for x and y
  const {slope: ax, intercept: bx} = linearRegression(times, xs);
  const {slope: ay, intercept: by} = linearRegression(times, ys);

  // Fit quadratic for z (gravity effect)
  const {a: az, b: bz, c: cz} = quadraticRegression(times, zs);

  return {ax, bx, ay, by, az, bz, cz};
}

/**
 * Simple linear regression
 */
function linearRegression(
  x: number[],
  y: number[]
): {slope: number; intercept: number} {
  const n = x.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {slope, intercept};
}

/**
 * Quadratic regression for z = at^2 + bt + c
 */
function quadraticRegression(
  t: number[],
  z: number[]
): {a: number; b: number; c: number} {
  const n = t.length;

  // Build normal equations matrix
  let S0 = n,
    S1 = 0,
    S2 = 0,
    S3 = 0,
    S4 = 0;
  let T0 = 0,
    T1 = 0,
    T2 = 0;

  for (let i = 0; i < n; i++) {
    const t1 = t[i];
    const t2 = t1 * t1;
    const t3 = t2 * t1;
    const t4 = t3 * t1;

    S1 += t1;
    S2 += t2;
    S3 += t3;
    S4 += t4;

    T0 += z[i];
    T1 += z[i] * t1;
    T2 += z[i] * t2;
  }

  // Solve using Cramer's rule (simplified)
  const det =
    S0 * (S2 * S4 - S3 * S3) - S1 * (S1 * S4 - S2 * S3) + S2 * (S1 * S3 - S2 * S2);

  if (Math.abs(det) < 1e-10) {
    // Use gravity as default for z acceleration
    return {a: -GRAVITY / 2, b: 0, c: z[0] || 0};
  }

  const c =
    (T0 * (S2 * S4 - S3 * S3) - S1 * (T1 * S4 - T2 * S3) + S2 * (T1 * S3 - T2 * S2)) /
    det;
  const b =
    (S0 * (T1 * S4 - T2 * S3) - T0 * (S1 * S4 - S2 * S3) + S2 * (S1 * T2 - S2 * T1)) /
    det;
  const a =
    (S0 * (S2 * T2 - S3 * T1) - S1 * (S1 * T2 - S2 * T1) + T0 * (S1 * S3 - S2 * S2)) /
    det;

  return {a, b, c};
}

/**
 * Calculate position at time t using trajectory coefficients
 */
export function positionAtTime(coef: TrajectoryCoefficients, t: number): Point3D {
  return {
    x: coef.ax * t + coef.bx,
    y: coef.ay * t + coef.by,
    z: coef.az * t * t + coef.bz * t + coef.cz,
  };
}

/**
 * Find where trajectory intersects a horizontal plane (z = height)
 * Returns time t of intersection, or null if no intersection
 */
export function findPlaneIntersection(
  coef: TrajectoryCoefficients,
  height: number
): number | null {
  // Solve: az*t^2 + bz*t + (cz - height) = 0
  const a = coef.az;
  const b = coef.bz;
  const c = coef.cz - height;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return null;
  }

  // Take the positive root (future time)
  const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

  // Return the first positive time
  if (t1 > 0 && t2 > 0) {
    return Math.min(t1, t2);
  }
  if (t1 > 0) return t1;
  if (t2 > 0) return t2;

  return null;
}

/**
 * Find where ball pitches (first bounce, z = ball radius)
 */
export function findPitchPoint(coef: TrajectoryCoefficients): Point3D | null {
  const t = findPlaneIntersection(coef, CRICKET_CONSTANTS.BALL_RADIUS);
  if (t === null) return null;
  return positionAtTime(coef, t);
}

/**
 * Project trajectory from impact point to stumps
 * Assumes roughly linear path after impact (simplified)
 */
export function projectToStumps(
  impactPoint: Point3D,
  velocity: {vx: number; vz: number},
  numPoints: number = 20
): Point3D[] {
  const path: Point3D[] = [];
  const distanceToStumps = impactPoint.y; // Distance from impact to stumps

  // Time to reach stumps
  const timeToStumps = 0.1; // Assume ~0.1 seconds (simplified)

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * timeToStumps;
    const progress = i / numPoints;

    path.push({
      x: impactPoint.x + velocity.vx * t,
      y: impactPoint.y * (1 - progress), // Move towards y=0 (stumps)
      z: Math.max(0, impactPoint.z + velocity.vz * t - 0.5 * GRAVITY * t * t),
    });
  }

  return path;
}

/**
 * Estimate velocity from trajectory at a given point
 */
export function velocityAtTime(
  coef: TrajectoryCoefficients,
  t: number
): {vx: number; vy: number; vz: number} {
  return {
    vx: coef.ax,
    vy: coef.ay,
    vz: 2 * coef.az * t + coef.bz,
  };
}

/**
 * Calculate ball speed in km/h from velocity
 */
export function speedKmh(velocity: {vx: number; vy: number; vz: number}): number {
  const speedMs = Math.sqrt(
    velocity.vx * velocity.vx + velocity.vy * velocity.vy + velocity.vz * velocity.vz
  );
  return speedMs * 3.6; // Convert m/s to km/h
}
