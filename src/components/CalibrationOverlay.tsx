import React from 'react';
import {StyleSheet, View, Text, Dimensions} from 'react-native';
import Svg, {Circle, Line, Rect, G, Text as SvgText} from 'react-native-svg';
import {CalibrationData, Point2D} from '../types';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface CalibrationOverlayProps {
  calibration: CalibrationData;
  currentStep: number;
  onPointSelect?: (point: Point2D) => void;
}

const CALIBRATION_STEPS = [
  {label: 'Top Left of Stumps', key: 'stumpsTopLeft'},
  {label: 'Top Right of Stumps', key: 'stumpsTopRight'},
  {label: 'Bottom Left of Stumps', key: 'stumpsBottomLeft'},
  {label: 'Bottom Right of Stumps', key: 'stumpsBottomRight'},
];

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({
  calibration,
  currentStep,
}) => {
  const getPointColor = (index: number) => {
    if (index < currentStep) return '#44ff44'; // Completed
    if (index === currentStep) return '#ffaa00'; // Current
    return '#666666'; // Pending
  };

  const points = [
    calibration.stumpsTopLeft,
    calibration.stumpsTopRight,
    calibration.stumpsBottomLeft,
    calibration.stumpsBottomRight,
  ];

  const hasValidPoint = (point: Point2D) => point.x !== 0 || point.y !== 0;

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Guide lines */}
        <G opacity={0.3}>
          {/* Center vertical line */}
          <Line
            x1={SCREEN_WIDTH / 2}
            y1={0}
            x2={SCREEN_WIDTH / 2}
            y2={SCREEN_HEIGHT}
            stroke="#ffffff"
            strokeWidth={1}
            strokeDasharray="10,10"
          />
          {/* Horizontal thirds */}
          <Line
            x1={0}
            y1={SCREEN_HEIGHT / 3}
            x2={SCREEN_WIDTH}
            y2={SCREEN_HEIGHT / 3}
            stroke="#ffffff"
            strokeWidth={1}
            strokeDasharray="10,10"
          />
          <Line
            x1={0}
            y1={(SCREEN_HEIGHT * 2) / 3}
            x2={SCREEN_WIDTH}
            y2={(SCREEN_HEIGHT * 2) / 3}
            stroke="#ffffff"
            strokeWidth={1}
            strokeDasharray="10,10"
          />
        </G>

        {/* Draw lines connecting calibration points */}
        {hasValidPoint(points[0]) && hasValidPoint(points[1]) && (
          <Line
            x1={points[0].x}
            y1={points[0].y}
            x2={points[1].x}
            y2={points[1].y}
            stroke="#44ff44"
            strokeWidth={2}
          />
        )}
        {hasValidPoint(points[2]) && hasValidPoint(points[3]) && (
          <Line
            x1={points[2].x}
            y1={points[2].y}
            x2={points[3].x}
            y2={points[3].y}
            stroke="#44ff44"
            strokeWidth={2}
          />
        )}
        {hasValidPoint(points[0]) && hasValidPoint(points[2]) && (
          <Line
            x1={points[0].x}
            y1={points[0].y}
            x2={points[2].x}
            y2={points[2].y}
            stroke="#44ff44"
            strokeWidth={2}
          />
        )}
        {hasValidPoint(points[1]) && hasValidPoint(points[3]) && (
          <Line
            x1={points[1].x}
            y1={points[1].y}
            x2={points[3].x}
            y2={points[3].y}
            stroke="#44ff44"
            strokeWidth={2}
          />
        )}

        {/* Draw calibration points */}
        {points.map((point, index) => {
          if (!hasValidPoint(point)) return null;
          return (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={12}
                fill={getPointColor(index)}
                opacity={0.8}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill="#ffffff"
              />
              <SvgText
                x={point.x + 15}
                y={point.y + 5}
                fill="#ffffff"
                fontSize={12}
                fontWeight="bold">
                {index + 1}
              </SvgText>
            </G>
          );
        })}

        {/* Highlight current target area */}
        {currentStep < 4 && (
          <G>
            <Circle
              cx={SCREEN_WIDTH / 2}
              cy={SCREEN_HEIGHT / 2}
              r={50}
              fill="none"
              stroke="#ffaa00"
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.5}
            />
          </G>
        )}
      </Svg>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <Text style={styles.stepIndicator}>
          Step {currentStep + 1} of {CALIBRATION_STEPS.length}
        </Text>
        <Text style={styles.instruction}>
          {currentStep < CALIBRATION_STEPS.length
            ? `Tap the ${CALIBRATION_STEPS[currentStep].label}`
            : 'Calibration Complete!'}
        </Text>
      </View>

      {/* Progress indicators */}
      <View style={styles.progressContainer}>
        {CALIBRATION_STEPS.map((step, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {backgroundColor: getPointColor(index)},
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  instructionContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stepIndicator: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
});
