import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import Svg, {
  Circle,
  Path,
  Rect,
  Line,
  G,
  Text as SvgText,
} from 'react-native-svg';
import {Trajectory, LBWDecision, Point3D, CRICKET_CONSTANTS} from '../types';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface TrajectoryOverlayProps {
  trajectory: Trajectory | null;
  decision?: LBWDecision | null;
  showStumps?: boolean;
  showLabels?: boolean;
}

// Convert world coordinates to screen coordinates for visualization
const worldToScreen = (point: Point3D, viewWidth: number, viewHeight: number) => {
  // Map world coordinates to screen:
  // x: -0.2 to 0.2 maps to 0 to viewWidth
  // y: 0 to 20 maps to viewHeight to 0 (inverted)
  // z is used for color/size

  const centerX = viewWidth / 2;
  const scaleX = viewWidth / 0.4; // 0.4m total width range

  const scaleY = viewHeight / 20; // 20m total y range

  return {
    x: centerX + point.x * scaleX,
    y: viewHeight - point.y * scaleY - point.z * 50, // Height affects vertical position
  };
};

export const TrajectoryOverlay: React.FC<TrajectoryOverlayProps> = ({
  trajectory,
  decision,
  showStumps = true,
  showLabels = true,
}) => {
  if (!trajectory) {
    return null;
  }

  const viewWidth = SCREEN_WIDTH;
  const viewHeight = SCREEN_HEIGHT * 0.6; // Use 60% of screen for pitch view

  // Build trajectory path
  const trajectoryPath = trajectory.positions
    .map((pos, i) => {
      const screen = worldToScreen(pos.worldPosition, viewWidth, viewHeight);
      return `${i === 0 ? 'M' : 'L'} ${screen.x} ${screen.y}`;
    })
    .join(' ');

  // Build projected path
  const projectedPath = trajectory.projectedPath
    .map((pos, i) => {
      const screen = worldToScreen(pos, viewWidth, viewHeight);
      return `${i === 0 ? 'M' : 'L'} ${screen.x} ${screen.y}`;
    })
    .join(' ');

  // Key points
  const pitchPointScreen = trajectory.pitchPoint
    ? worldToScreen(trajectory.pitchPoint, viewWidth, viewHeight)
    : null;
  const impactPointScreen = trajectory.impactPoint
    ? worldToScreen(trajectory.impactPoint, viewWidth, viewHeight)
    : null;
  const stumpIntersection = decision?.stumpIntersection
    ? worldToScreen(decision.stumpIntersection, viewWidth, viewHeight)
    : null;

  // Stump position
  const stumpLeft = worldToScreen(
    {x: CRICKET_CONSTANTS.OFF_STUMP, y: 0, z: 0},
    viewWidth,
    viewHeight
  );
  const stumpRight = worldToScreen(
    {x: CRICKET_CONSTANTS.LEG_STUMP, y: 0, z: 0},
    viewWidth,
    viewHeight
  );
  const stumpTop = worldToScreen(
    {x: 0, y: 0, z: CRICKET_CONSTANTS.STUMP_HEIGHT},
    viewWidth,
    viewHeight
  );

  // Colors based on decision
  const getVerdictColor = () => {
    if (!decision) return '#ffffff';
    switch (decision.verdict) {
      case 'OUT':
        return '#ff4444';
      case 'NOT_OUT':
        return '#44ff44';
      case 'UMPIRES_CALL':
        return '#ffaa00';
    }
  };

  return (
    <View style={styles.container}>
      <Svg width={viewWidth} height={viewHeight}>
        {/* Stumps */}
        {showStumps && (
          <G>
            {/* Stump rectangle */}
            <Rect
              x={stumpLeft.x}
              y={stumpTop.y}
              width={stumpRight.x - stumpLeft.x}
              height={stumpLeft.y - stumpTop.y}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
            />
            {/* Individual stumps */}
            <Line
              x1={stumpLeft.x}
              y1={stumpTop.y}
              x2={stumpLeft.x}
              y2={stumpLeft.y}
              stroke="#ffffff"
              strokeWidth={3}
            />
            <Line
              x1={(stumpLeft.x + stumpRight.x) / 2}
              y1={stumpTop.y}
              x2={(stumpLeft.x + stumpRight.x) / 2}
              y2={stumpLeft.y}
              stroke="#ffffff"
              strokeWidth={3}
            />
            <Line
              x1={stumpRight.x}
              y1={stumpTop.y}
              x2={stumpRight.x}
              y2={stumpLeft.y}
              stroke="#ffffff"
              strokeWidth={3}
            />
            {/* Bails */}
            <Line
              x1={stumpLeft.x - 5}
              y1={stumpTop.y}
              x2={stumpRight.x + 5}
              y2={stumpTop.y}
              stroke="#ffcc00"
              strokeWidth={4}
            />
          </G>
        )}

        {/* Actual trajectory */}
        {trajectoryPath && (
          <Path
            d={trajectoryPath}
            fill="none"
            stroke="#00ff00"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Projected trajectory */}
        {projectedPath && (
          <Path
            d={projectedPath}
            fill="none"
            stroke={getVerdictColor()}
            strokeWidth={3}
            strokeDasharray="10,5"
            strokeLinecap="round"
          />
        )}

        {/* Pitch point */}
        {pitchPointScreen && (
          <G>
            <Circle
              cx={pitchPointScreen.x}
              cy={pitchPointScreen.y}
              r={8}
              fill="#ff9900"
            />
            {showLabels && (
              <SvgText
                x={pitchPointScreen.x + 15}
                y={pitchPointScreen.y}
                fill="#ff9900"
                fontSize={12}
                fontWeight="bold">
                PITCH
              </SvgText>
            )}
          </G>
        )}

        {/* Impact point */}
        {impactPointScreen && (
          <G>
            <Circle
              cx={impactPointScreen.x}
              cy={impactPointScreen.y}
              r={10}
              fill="#ff0000"
            />
            {showLabels && (
              <SvgText
                x={impactPointScreen.x + 15}
                y={impactPointScreen.y}
                fill="#ff0000"
                fontSize={12}
                fontWeight="bold">
                IMPACT
              </SvgText>
            )}
          </G>
        )}

        {/* Stump intersection */}
        {stumpIntersection && (
          <G>
            <Circle
              cx={stumpIntersection.x}
              cy={stumpIntersection.y}
              r={12}
              fill={getVerdictColor()}
              opacity={0.7}
            />
          </G>
        )}

        {/* Ball positions along trajectory */}
        {trajectory.positions.map((pos, i) => {
          const screen = worldToScreen(pos.worldPosition, viewWidth, viewHeight);
          const opacity = 0.3 + (i / trajectory.positions.length) * 0.7;
          return (
            <Circle
              key={i}
              cx={screen.x}
              cy={screen.y}
              r={4}
              fill="#00ff00"
              opacity={opacity}
            />
          );
        })}
      </Svg>
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
});
