import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import {TrajectoryOverlay} from '../components/TrajectoryOverlay';
import {DecisionDisplay} from '../components/DecisionDisplay';
import {getTrajectoryStats} from '../services/trajectoryAnalyzer';

type ResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Result'
>;

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

interface ResultScreenProps {
  navigation: ResultScreenNavigationProp;
  route: ResultScreenRouteProp;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  navigation,
  route,
}) => {
  const {trajectory, decision} = route.params;
  const stats = getTrajectoryStats(trajectory);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Trajectory Visualization */}
        <View style={styles.visualizationContainer}>
          <Text style={styles.sectionTitle}>Ball Trajectory</Text>
          <View style={styles.trajectoryView}>
            <TrajectoryOverlay
              trajectory={trajectory}
              decision={decision}
              showStumps={true}
              showLabels={true}
            />
          </View>
        </View>

        {/* Decision */}
        <View style={styles.decisionSection}>
          <Text style={styles.sectionTitle}>LBW Decision</Text>
          <DecisionDisplay decision={decision} showDetails={true} />
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Delivery Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tracked Points</Text>
              <Text style={styles.statValue}>{trajectory.positions.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{stats.duration.toFixed(2)}s</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Estimated Speed</Text>
              <Text style={styles.statValue}>{stats.avgSpeed.toFixed(0)} km/h</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Projected Points</Text>
              <Text style={styles.statValue}>{trajectory.projectedPath.length}</Text>
            </View>
          </View>
        </View>

        {/* Debug Info */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Release: {trajectory.releasePoint
              ? `(${trajectory.releasePoint.x.toFixed(2)}, ${trajectory.releasePoint.y.toFixed(2)}, ${trajectory.releasePoint.z.toFixed(2)})`
              : 'N/A'}
          </Text>
          <Text style={styles.debugText}>
            Pitch: {trajectory.pitchPoint
              ? `(${trajectory.pitchPoint.x.toFixed(2)}, ${trajectory.pitchPoint.y.toFixed(2)}, ${trajectory.pitchPoint.z.toFixed(2)})`
              : 'N/A'}
          </Text>
          <Text style={styles.debugText}>
            Impact: {trajectory.impactPoint
              ? `(${trajectory.impactPoint.x.toFixed(2)}, ${trajectory.impactPoint.y.toFixed(2)}, ${trajectory.impactPoint.z.toFixed(2)})`
              : 'N/A'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.tryAgainButtonText}>Try Another Delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  visualizationContainer: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  trajectoryView: {
    height: 400,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  decisionSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  debugSection: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  debugTitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  debugText: {
    color: '#555',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  tryAgainButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  homeButtonText: {
    color: '#aaa',
    fontSize: 14,
  },
});
