import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, CalibrationData} from '../types';
import {
  loadCalibration,
  estimateCalibrationQuality,
} from '../services/calibration';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [calibrationQuality, setCalibrationQuality] = useState<{
    quality: 'good' | 'fair' | 'poor';
    score: number;
  } | null>(null);

  useEffect(() => {
    loadSavedCalibration();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedCalibration();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSavedCalibration = async () => {
    const saved = await loadCalibration();
    setCalibration(saved);
    if (saved) {
      const quality = estimateCalibrationQuality(saved);
      setCalibrationQuality(quality);
    } else {
      setCalibrationQuality(null);
    }
  };

  const getCalibrationStatusColor = () => {
    if (!calibrationQuality) return '#666';
    switch (calibrationQuality.quality) {
      case 'good':
        return '#44ff44';
      case 'fair':
        return '#ffaa00';
      case 'poor':
        return '#ff4444';
    }
  };

  const canStartAnalysis = calibration?.isCalibrated;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <Text style={styles.title}>Cricket LBW</Text>
        <Text style={styles.subtitle}>Decision Support System</Text>
      </View>

      <View style={styles.content}>
        {/* Calibration Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Calibration Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                {backgroundColor: getCalibrationStatusColor()},
              ]}
            />
            <Text style={styles.statusText}>
              {calibration?.isCalibrated
                ? `Calibrated (${calibrationQuality?.quality || 'unknown'})`
                : 'Not Calibrated'}
            </Text>
          </View>
          {calibrationQuality && (
            <Text style={styles.statusScore}>
              Quality Score: {calibrationQuality.score}%
            </Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instruction}>
            1. Calibrate by marking the stumps position
          </Text>
          <Text style={styles.instruction}>
            2. Place phone at ground level facing stumps
          </Text>
          <Text style={styles.instruction}>
            3. Start recording when bowler delivers
          </Text>
          <Text style={styles.instruction}>
            4. View LBW decision analysis
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.calibrateButton}
            onPress={() => navigation.navigate('Calibration')}>
            <Text style={styles.calibrateButtonText}>
              {calibration?.isCalibrated ? 'Recalibrate' : 'Calibrate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startButton,
              !canStartAnalysis && styles.startButtonDisabled,
            ]}
            onPress={() => navigation.navigate('Camera')}
            disabled={!canStartAnalysis}>
            <Text style={styles.startButtonText}>Start Analysis</Text>
          </TouchableOpacity>
        </View>

        {!canStartAnalysis && (
          <Text style={styles.warningText}>
            Please calibrate before starting analysis
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MVP Prototype - Uses simulated ball detection
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusScore: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  instructionsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instruction: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  calibrateButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  calibrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#1a3d1c',
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#ff9900',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
  versionText: {
    color: '#444',
    fontSize: 10,
    marginTop: 4,
  },
});
