import {
  Trajectory,
  LBWDecision,
  LBWVerdict,
  PitchingResult,
  ImpactResult,
  HittingResult,
  Point3D,
  CRICKET_CONSTANTS,
} from '../types';
import {isWithinStumps, isInUmpiresCallZone} from '../utils/geometry';
import {getStumpIntersection} from './trajectoryAnalyzer';

const {OFF_STUMP, LEG_STUMP, STUMP_HEIGHT, UMPIRES_CALL_MARGIN} = CRICKET_CONSTANTS;

/**
 * LBW Decision Engine
 * Applies cricket LBW rules to trajectory data
 */

/**
 * Check where ball pitched relative to stumps
 */
function checkPitching(pitchPoint: Point3D | null): PitchingResult {
  if (!pitchPoint) {
    // If we can't determine pitch point, assume inline
    return 'INLINE';
  }

  if (pitchPoint.x > LEG_STUMP + UMPIRES_CALL_MARGIN) {
    // Pitched outside leg stump
    return 'OUTSIDE_LEG';
  }

  if (pitchPoint.x < OFF_STUMP - UMPIRES_CALL_MARGIN) {
    // Pitched outside off stump
    return 'OUTSIDE_OFF';
  }

  // Pitched inline or within umpire's call zone
  return 'INLINE';
}

/**
 * Check where ball hit pad relative to stumps
 * Note: For LBW, impact outside off with no shot is still out
 * For MVP, we assume shot was played
 */
function checkImpact(impactPoint: Point3D | null, shotPlayed: boolean = true): ImpactResult {
  if (!impactPoint) {
    // If we can't determine impact point, assume inline
    return 'INLINE';
  }

  // If no shot played, impact doesn't matter
  if (!shotPlayed) {
    return 'INLINE';
  }

  // Check if impact is in line with stumps
  if (impactPoint.x >= OFF_STUMP - UMPIRES_CALL_MARGIN &&
      impactPoint.x <= LEG_STUMP + UMPIRES_CALL_MARGIN) {
    return 'INLINE';
  }

  return 'OUTSIDE_LINE';
}

/**
 * Check if ball would hit stumps based on projected path
 */
function checkHitting(projectedPath: Point3D[]): {
  result: HittingResult;
  intersection: Point3D | null;
} {
  const intersection = getStumpIntersection(projectedPath);

  if (!intersection) {
    return {result: 'MISSING', intersection: null};
  }

  // Check if within stumps
  const withinStumps = isWithinStumps(intersection);
  const inUmpiresCall = isInUmpiresCallZone(intersection);

  if (!withinStumps) {
    // Check how close it is
    const xMiss = intersection.x < OFF_STUMP
      ? OFF_STUMP - intersection.x
      : intersection.x > LEG_STUMP
        ? intersection.x - LEG_STUMP
        : 0;

    const zMiss = intersection.z > STUMP_HEIGHT
      ? intersection.z - STUMP_HEIGHT
      : intersection.z < 0
        ? -intersection.z
        : 0;

    // If very close, it's umpire's call
    if (xMiss <= UMPIRES_CALL_MARGIN && zMiss <= UMPIRES_CALL_MARGIN) {
      return {result: 'UMPIRES_CALL', intersection};
    }

    return {result: 'MISSING', intersection};
  }

  // Within stumps
  if (inUmpiresCall) {
    return {result: 'UMPIRES_CALL', intersection};
  }

  return {result: 'HITTING', intersection};
}

/**
 * Determine LBW decision based on all factors
 */
function determineVerdict(
  pitching: PitchingResult,
  impact: ImpactResult,
  hitting: HittingResult
): {verdict: LBWVerdict; reason: string} {
  // Rule 1: Ball pitching outside leg is always NOT OUT
  if (pitching === 'OUTSIDE_LEG') {
    return {
      verdict: 'NOT_OUT',
      reason: 'Ball pitched outside leg stump',
    };
  }

  // Rule 2: Impact outside line (with shot played) is NOT OUT
  if (impact === 'OUTSIDE_LINE') {
    return {
      verdict: 'NOT_OUT',
      reason: 'Impact outside the line of off stump',
    };
  }

  // Rule 3: Ball not hitting stumps is NOT OUT
  if (hitting === 'MISSING') {
    return {
      verdict: 'NOT_OUT',
      reason: 'Ball going on to miss the stumps',
    };
  }

  // Rule 4: Umpire's call - original decision stands
  if (hitting === 'UMPIRES_CALL') {
    return {
      verdict: 'UMPIRES_CALL',
      reason: 'Ball clipping stumps - Umpire\'s Call',
    };
  }

  // All conditions met - OUT
  return {
    verdict: 'OUT',
    reason: 'Ball pitched inline, hit inline, hitting stumps',
  };
}

/**
 * Calculate confidence score for the decision
 */
function calculateConfidence(trajectory: Trajectory): number {
  let confidence = 1.0;

  // Reduce confidence based on number of tracked positions
  const positionCount = trajectory.positions.length;
  if (positionCount < 10) {
    confidence *= 0.7;
  } else if (positionCount < 20) {
    confidence *= 0.85;
  }

  // Reduce confidence if key points are estimated
  if (!trajectory.pitchPoint) {
    confidence *= 0.8;
  }

  if (!trajectory.impactPoint) {
    confidence *= 0.7;
  }

  // Reduce confidence if projected path is short
  if (trajectory.projectedPath.length < 10) {
    confidence *= 0.8;
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Generate detailed decision breakdown
 */
function generateDetailedReason(
  pitching: PitchingResult,
  impact: ImpactResult,
  hitting: HittingResult,
  pitchPoint: Point3D | null,
  impactPoint: Point3D | null,
  stumpIntersection: Point3D | null
): string {
  const details: string[] = [];

  // Pitching description
  if (pitchPoint) {
    const pitchX = Math.round(pitchPoint.x * 100) / 100;
    const pitchY = Math.round(pitchPoint.y * 100) / 100;
    details.push(`Pitched at x=${pitchX}m, ${pitchY}m from stumps (${pitching})`);
  }

  // Impact description
  if (impactPoint) {
    const impactX = Math.round(impactPoint.x * 100) / 100;
    const impactZ = Math.round(impactPoint.z * 100) / 100;
    details.push(`Impact at x=${impactX}m, height=${impactZ}m (${impact})`);
  }

  // Hitting description
  if (stumpIntersection) {
    const hitX = Math.round(stumpIntersection.x * 100) / 100;
    const hitZ = Math.round(stumpIntersection.z * 100) / 100;
    details.push(`Would hit stumps at x=${hitX}m, height=${hitZ}m (${hitting})`);
  }

  return details.join('. ');
}

/**
 * Main LBW decision function
 */
export function analyzeLBW(
  trajectory: Trajectory,
  shotPlayed: boolean = true
): LBWDecision {
  const {pitchPoint, impactPoint, projectedPath} = trajectory;

  // Check each LBW criterion
  const pitchingResult = checkPitching(pitchPoint);
  const impactResult = checkImpact(impactPoint, shotPlayed);
  const {result: hittingResult, intersection: stumpIntersection} = checkHitting(projectedPath);

  // Determine verdict
  const {verdict, reason} = determineVerdict(pitchingResult, impactResult, hittingResult);

  // Calculate confidence
  const confidence = calculateConfidence(trajectory);

  return {
    verdict,
    reason,
    pitchingResult,
    impactResult,
    hittingResult,
    confidence,
    pitchPoint,
    impactPoint,
    stumpIntersection,
  };
}

/**
 * Get human-readable description of decision
 */
export function getDecisionDescription(decision: LBWDecision): string {
  const {verdict, pitchingResult, impactResult, hittingResult} = decision;

  let description = `**${verdict}**\n\n`;

  description += `Pitching: ${formatPitching(pitchingResult)}\n`;
  description += `Impact: ${formatImpact(impactResult)}\n`;
  description += `Hitting: ${formatHitting(hittingResult)}\n\n`;
  description += `Confidence: ${Math.round(decision.confidence * 100)}%`;

  return description;
}

function formatPitching(result: PitchingResult): string {
  switch (result) {
    case 'INLINE':
      return 'In line with stumps';
    case 'OUTSIDE_OFF':
      return 'Outside off stump (OK)';
    case 'OUTSIDE_LEG':
      return 'Outside leg stump (NOT OUT)';
  }
}

function formatImpact(result: ImpactResult): string {
  switch (result) {
    case 'INLINE':
      return 'In line with stumps';
    case 'OUTSIDE_LINE':
      return 'Outside the line';
  }
}

function formatHitting(result: HittingResult): string {
  switch (result) {
    case 'HITTING':
      return 'Hitting stumps';
    case 'MISSING':
      return 'Missing stumps';
    case 'UMPIRES_CALL':
      return 'Clipping stumps (Umpire\'s Call)';
  }
}
