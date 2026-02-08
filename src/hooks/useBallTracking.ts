import {useState, useCallback, useRef, useEffect} from 'react';
import {BallDetection, RecordingState, Trajectory, CalibrationData} from '../types';
import {
  detectBall,
  startSimulation,
  stopSimulation,
  isSimulationRunning,
  setMockTrajectory,
  MOCK_TRAJECTORIES,
} from '../services/ballDetector';
import {analyzeTrajectory} from '../services/trajectoryAnalyzer';

const DETECTION_INTERVAL = 50; // ms between detections (20 fps)
const MAX_RECORDING_DURATION = 5000; // 5 seconds max recording

interface UseBallTrackingResult {
  recordingState: RecordingState;
  startRecording: () => void;
  stopRecording: () => Trajectory | null;
  isRecording: boolean;
  detectionCount: number;
  selectTrajectory: (name: string) => void;
  availableTrajectories: string[];
}

export function useBallTracking(
  calibration: CalibrationData,
  screenWidth: number = 1080,
  screenHeight: number = 1920
): UseBallTrackingResult {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    startTime: null,
    frameCount: 0,
    ballDetections: [],
  });

  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      stopSimulation();
    };
  }, []);

  const startRecording = useCallback(() => {
    // Reset state
    setRecordingState({
      isRecording: true,
      startTime: Date.now(),
      frameCount: 0,
      ballDetections: [],
    });

    // Start ball simulation
    startSimulation();

    // Start detection loop
    detectionIntervalRef.current = setInterval(() => {
      const detection = detectBall(null, screenWidth, screenHeight);

      if (detection) {
        setRecordingState(prev => ({
          ...prev,
          frameCount: prev.frameCount + 1,
          ballDetections: [...prev.ballDetections, detection],
        }));
      }

      // Check if simulation is still running
      if (!isSimulationRunning()) {
        // Auto-stop when simulation ends
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
          detectionIntervalRef.current = null;
        }
      }
    }, DETECTION_INTERVAL);

    // Set max recording timeout
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecordingInternal();
    }, MAX_RECORDING_DURATION);
  }, [screenWidth, screenHeight]);

  const stopRecordingInternal = useCallback(() => {
    // Clear intervals
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    // Stop simulation
    stopSimulation();

    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
    }));
  }, []);

  const stopRecording = useCallback((): Trajectory | null => {
    stopRecordingInternal();

    // Analyze trajectory
    const trajectory = analyzeTrajectory(
      recordingState.ballDetections,
      calibration,
      screenHeight
    );

    return trajectory;
  }, [recordingState.ballDetections, calibration, screenHeight, stopRecordingInternal]);

  const selectTrajectory = useCallback((name: string) => {
    if (name in MOCK_TRAJECTORIES) {
      setMockTrajectory(name as keyof typeof MOCK_TRAJECTORIES);
    }
  }, []);

  const availableTrajectories = Object.keys(MOCK_TRAJECTORIES);

  return {
    recordingState,
    startRecording,
    stopRecording,
    isRecording: recordingState.isRecording,
    detectionCount: recordingState.ballDetections.length,
    selectTrajectory,
    availableTrajectories,
  };
}
