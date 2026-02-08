import {BallDetection, Point2D, Point3D, CRICKET_CONSTANTS} from '../types';

/**
 * Mock ball detector for MVP
 * Simulates ball detection along a predefined trajectory
 */

// Mock trajectory parameters
interface MockTrajectoryConfig {
  releasePoint: Point3D;
  pitchPoint: Point3D;
  impactPoint: Point3D;
  speed: number; // km/h
  swing: number; // lateral movement in meters
}

// Default trajectory configurations for testing
export const MOCK_TRAJECTORIES: Record<string, MockTrajectoryConfig> = {
  // Ball hitting middle stump - should be OUT
  hittingMiddle: {
    releasePoint: {x: 0.05, y: 20, z: 2.0},
    pitchPoint: {x: 0.02, y: 8, z: 0},
    impactPoint: {x: 0, y: 2, z: 0.35},
    speed: 130,
    swing: 0.03,
  },
  // Ball pitching outside leg - should be NOT OUT
  outsideLeg: {
    releasePoint: {x: 0.2, y: 20, z: 2.0},
    pitchPoint: {x: 0.15, y: 8, z: 0},
    impactPoint: {x: 0.12, y: 2, z: 0.3},
    speed: 125,
    swing: -0.02,
  },
  // Ball missing off stump - should be NOT OUT
  missingOff: {
    releasePoint: {x: -0.1, y: 20, z: 2.0},
    pitchPoint: {x: -0.08, y: 8, z: 0},
    impactPoint: {x: -0.1, y: 2, z: 0.4},
    speed: 135,
    swing: -0.05,
  },
  // Ball going over stumps - should be NOT OUT
  goingOver: {
    releasePoint: {x: 0, y: 20, z: 2.2},
    pitchPoint: {x: 0, y: 6, z: 0},
    impactPoint: {x: 0, y: 2, z: 0.8},
    speed: 140,
    swing: 0,
  },
  // Ball hitting leg stump - should be OUT
  hittingLeg: {
    releasePoint: {x: 0.08, y: 20, z: 2.0},
    pitchPoint: {x: 0.06, y: 8, z: 0},
    impactPoint: {x: 0.1, y: 2, z: 0.25},
    speed: 128,
    swing: 0.02,
  },
};

// Current mock trajectory
let currentTrajectory: MockTrajectoryConfig = MOCK_TRAJECTORIES.hittingMiddle;
let simulationStartTime: number | null = null;
let isSimulating = false;

/**
 * Set the mock trajectory for testing
 */
export function setMockTrajectory(name: keyof typeof MOCK_TRAJECTORIES): void {
  currentTrajectory = MOCK_TRAJECTORIES[name];
}

/**
 * Set a custom mock trajectory
 */
export function setCustomTrajectory(config: MockTrajectoryConfig): void {
  currentTrajectory = config;
}

/**
 * Start ball simulation
 */
export function startSimulation(): void {
  simulationStartTime = Date.now();
  isSimulating = true;
}

/**
 * Stop ball simulation
 */
export function stopSimulation(): void {
  isSimulating = false;
  simulationStartTime = null;
}

/**
 * Check if simulation is running
 */
export function isSimulationRunning(): boolean {
  return isSimulating;
}

/**
 * Interpolate position along the trajectory
 */
function interpolatePosition(progress: number): Point3D {
  const {releasePoint, pitchPoint, impactPoint} = currentTrajectory;

  if (progress <= 0.5) {
    // Release to pitch
    const t = progress * 2;
    return {
      x: releasePoint.x + (pitchPoint.x - releasePoint.x) * t,
      y: releasePoint.y + (pitchPoint.y - releasePoint.y) * t,
      z: releasePoint.z + (pitchPoint.z - releasePoint.z) * t,
    };
  } else {
    // Pitch to impact
    const t = (progress - 0.5) * 2;
    return {
      x: pitchPoint.x + (impactPoint.x - pitchPoint.x) * t,
      y: pitchPoint.y + (impactPoint.y - pitchPoint.y) * t,
      z: pitchPoint.z + (impactPoint.z - pitchPoint.z) * t,
    };
  }
}

/**
 * Convert 3D world position to 2D screen coordinates (simplified)
 */
function worldToScreen(point: Point3D, screenWidth: number, screenHeight: number): Point2D {
  // Simplified projection assuming camera at ground level looking at stumps
  // Map world coordinates to screen:
  // - x: world x maps to screen x centered on screen
  // - y: world y (distance) maps inversely to screen y (further = higher on screen)

  const scale = 300; // Pixels per meter at 1m distance

  // Center of screen
  const centerX = screenWidth / 2;
  const bottomY = screenHeight - 100; // Leave some margin at bottom

  // Distance affects scale (perspective)
  const distanceScale = 20 / Math.max(point.y, 1); // Scale based on distance

  return {
    x: centerX + point.x * scale * distanceScale,
    y: bottomY - point.y * 20 * distanceScale - point.z * scale * distanceScale * 0.5,
  };
}

/**
 * Detect ball in frame (mock implementation)
 * Returns simulated ball position based on trajectory
 */
export function detectBall(
  _frameData: unknown,
  screenWidth: number = 1080,
  screenHeight: number = 1920
): BallDetection | null {
  if (!isSimulating || !simulationStartTime) {
    return null;
  }

  const elapsed = Date.now() - simulationStartTime;
  const totalDuration = 1500; // 1.5 seconds for full delivery

  // Progress through trajectory (0 to 1)
  const progress = Math.min(elapsed / totalDuration, 1);

  if (progress >= 1) {
    // Simulation complete
    return null;
  }

  // Get 3D position
  const worldPos = interpolatePosition(progress);

  // Convert to screen coordinates
  const screenPos = worldToScreen(worldPos, screenWidth, screenHeight);

  // Add some noise for realism
  const noise = 3;
  screenPos.x += (Math.random() - 0.5) * noise;
  screenPos.y += (Math.random() - 0.5) * noise;

  return {
    position: screenPos,
    confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    timestamp: Date.now(),
  };
}

/**
 * Get the current mock trajectory config (for testing)
 */
export function getCurrentTrajectory(): MockTrajectoryConfig {
  return currentTrajectory;
}

/**
 * Get all available mock trajectory names
 */
export function getAvailableTrajectories(): string[] {
  return Object.keys(MOCK_TRAJECTORIES);
}
