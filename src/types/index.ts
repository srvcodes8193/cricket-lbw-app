// 3D Point representing position in meters
export interface Point3D {
  x: number; // Left-right (off to leg for right-hander)
  y: number; // Distance from stumps towards bowler
  z: number; // Height from ground
}

// 2D Point for screen coordinates
export interface Point2D {
  x: number;
  y: number;
}

// Ball detection result from a single frame
export interface BallDetection {
  position: Point2D;
  confidence: number;
  timestamp: number;
}

// Tracked ball position over time
export interface TrackedPosition {
  screenPosition: Point2D;
  worldPosition: Point3D;
  timestamp: number;
}

// Complete trajectory data
export interface Trajectory {
  positions: TrackedPosition[];
  releasePoint: Point3D | null;
  pitchPoint: Point3D | null;
  impactPoint: Point3D | null;
  projectedPath: Point3D[];
}

// Calibration data for coordinate transformation
export interface CalibrationData {
  // Screen positions of stumps
  stumpsTopLeft: Point2D;
  stumpsTopRight: Point2D;
  stumpsBottomLeft: Point2D;
  stumpsBottomRight: Point2D;
  // Crease position
  creaseLeft: Point2D;
  creaseRight: Point2D;
  // Calculated transformation matrix
  homography: number[][] | null;
  // Calibration status
  isCalibrated: boolean;
}

// LBW decision result
export type LBWVerdict = 'OUT' | 'NOT_OUT' | 'UMPIRES_CALL';

export type PitchingResult = 'INLINE' | 'OUTSIDE_OFF' | 'OUTSIDE_LEG';
export type ImpactResult = 'INLINE' | 'OUTSIDE_LINE';
export type HittingResult = 'HITTING' | 'MISSING' | 'UMPIRES_CALL';

export interface LBWDecision {
  verdict: LBWVerdict;
  reason: string;
  pitchingResult: PitchingResult;
  impactResult: ImpactResult;
  hittingResult: HittingResult;
  confidence: number;
  // Detailed measurements
  pitchPoint: Point3D | null;
  impactPoint: Point3D | null;
  stumpIntersection: Point3D | null;
}

// Recording state
export interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  frameCount: number;
  ballDetections: BallDetection[];
}

// App navigation params
export type RootStackParamList = {
  Home: undefined;
  Calibration: undefined;
  Camera: undefined;
  Result: {
    trajectory: Trajectory;
    decision: LBWDecision;
  };
};

// Constants for cricket dimensions (in meters)
export const CRICKET_CONSTANTS = {
  // Stump dimensions
  STUMP_HEIGHT: 0.7112, // 28 inches
  STUMP_WIDTH: 0.2286, // 9 inches total width
  BAIL_HEIGHT: 0.0111, // 0.44 inches

  // Stump positions relative to center
  OFF_STUMP: -0.1143, // Half width to off side
  MIDDLE_STUMP: 0,
  LEG_STUMP: 0.1143, // Half width to leg side

  // Pitch dimensions
  PITCH_LENGTH: 20.12, // meters between creases
  CREASE_WIDTH: 2.64, // meters

  // Ball dimensions
  BALL_DIAMETER: 0.072, // 72mm
  BALL_RADIUS: 0.036,

  // Umpire's call margin (2.5cm)
  UMPIRES_CALL_MARGIN: 0.025,
};
