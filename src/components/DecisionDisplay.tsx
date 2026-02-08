import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {LBWDecision, CRICKET_CONSTANTS} from '../types';

interface DecisionDisplayProps {
  decision: LBWDecision;
  showDetails?: boolean;
}

export const DecisionDisplay: React.FC<DecisionDisplayProps> = ({
  decision,
  showDetails = true,
}) => {
  const getVerdictColor = () => {
    switch (decision.verdict) {
      case 'OUT':
        return '#ff4444';
      case 'NOT_OUT':
        return '#44ff44';
      case 'UMPIRES_CALL':
        return '#ffaa00';
    }
  };

  const getVerdictText = () => {
    switch (decision.verdict) {
      case 'OUT':
        return 'OUT';
      case 'NOT_OUT':
        return 'NOT OUT';
      case 'UMPIRES_CALL':
        return "UMPIRE'S CALL";
    }
  };

  const getPitchingIcon = () => {
    switch (decision.pitchingResult) {
      case 'INLINE':
        return '✓';
      case 'OUTSIDE_OFF':
        return '✓';
      case 'OUTSIDE_LEG':
        return '✗';
    }
  };

  const getImpactIcon = () => {
    switch (decision.impactResult) {
      case 'INLINE':
        return '✓';
      case 'OUTSIDE_LINE':
        return '✗';
    }
  };

  const getHittingIcon = () => {
    switch (decision.hittingResult) {
      case 'HITTING':
        return '✓';
      case 'MISSING':
        return '✗';
      case 'UMPIRES_CALL':
        return '?';
    }
  };

  const formatPosition = (value: number | undefined) => {
    if (value === undefined) return '-';
    return `${(value * 100).toFixed(1)}cm`;
  };

  return (
    <View style={styles.container}>
      {/* Main verdict */}
      <View style={[styles.verdictContainer, {backgroundColor: getVerdictColor()}]}>
        <Text style={styles.verdictText}>{getVerdictText()}</Text>
      </View>

      {/* Reason */}
      <Text style={styles.reasonText}>{decision.reason}</Text>

      {/* Confidence */}
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              {width: `${decision.confidence * 100}%`},
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>
          {Math.round(decision.confidence * 100)}%
        </Text>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          {/* Pitching */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{getPitchingIcon()}</Text>
            <Text style={styles.detailLabel}>Pitching</Text>
            <Text style={styles.detailValue}>
              {decision.pitchingResult.replace('_', ' ')}
            </Text>
          </View>

          {/* Impact */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{getImpactIcon()}</Text>
            <Text style={styles.detailLabel}>Impact</Text>
            <Text style={styles.detailValue}>
              {decision.impactResult.replace('_', ' ')}
            </Text>
          </View>

          {/* Hitting */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{getHittingIcon()}</Text>
            <Text style={styles.detailLabel}>Wickets</Text>
            <Text style={styles.detailValue}>
              {decision.hittingResult.replace('_', ' ')}
            </Text>
          </View>

          {/* Measurements */}
          {decision.pitchPoint && (
            <View style={styles.measurementRow}>
              <Text style={styles.measurementLabel}>Pitch Point:</Text>
              <Text style={styles.measurementValue}>
                x={formatPosition(decision.pitchPoint.x)},{' '}
                {decision.pitchPoint.y.toFixed(1)}m from stumps
              </Text>
            </View>
          )}

          {decision.impactPoint && (
            <View style={styles.measurementRow}>
              <Text style={styles.measurementLabel}>Impact Point:</Text>
              <Text style={styles.measurementValue}>
                x={formatPosition(decision.impactPoint.x)},{' '}
                height={formatPosition(decision.impactPoint.z)}
              </Text>
            </View>
          )}

          {decision.stumpIntersection && (
            <View style={styles.measurementRow}>
              <Text style={styles.measurementLabel}>At Stumps:</Text>
              <Text style={styles.measurementValue}>
                x={formatPosition(decision.stumpIntersection.x)},{' '}
                height={formatPosition(decision.stumpIntersection.z)}
              </Text>
            </View>
          )}

          {/* Stump reference */}
          <View style={styles.stumpReference}>
            <Text style={styles.stumpRefText}>
              Off stump: {formatPosition(CRICKET_CONSTANTS.OFF_STUMP)} |{' '}
              Leg stump: {formatPosition(CRICKET_CONSTANTS.LEG_STUMP)}
            </Text>
            <Text style={styles.stumpRefText}>
              Stump height: {formatPosition(CRICKET_CONSTANTS.STUMP_HEIGHT)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  verdictContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  verdictText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  reasonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  confidenceLabel: {
    color: '#aaa',
    fontSize: 14,
    width: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#44ff44',
    borderRadius: 4,
  },
  confidenceValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  detailIcon: {
    color: '#fff',
    fontSize: 18,
    width: 30,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  measurementRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginTop: 8,
  },
  measurementLabel: {
    color: '#888',
    fontSize: 12,
    width: 100,
  },
  measurementValue: {
    color: '#aaa',
    fontSize: 12,
    flex: 1,
  },
  stumpReference: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  stumpRefText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
});
