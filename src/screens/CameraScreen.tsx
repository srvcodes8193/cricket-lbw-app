import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, CalibrationData, Trajectory} from '../types';
import {CameraView} from '../components/CameraView';
import {useBallTracking} from '../hooks/useBallTracking';
import {loadCalibration, getDefaultCalibration} from '../services/calibration';
import {analyzeLBW} from '../services/lbwEngine';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

type CameraScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Camera'
>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({navigation}) => {
  const [calibration, setCalibration] = useState<CalibrationData>(
    getDefaultCalibration()
  );
  const [selectedTrajectory, setSelectedTrajectory] = useState('hittingMiddle');

  const {
    isRecording,
    startRecording,
    stopRecording,
    detectionCount,
    selectTrajectory,
    availableTrajectories,
  } = useBallTracking(calibration, SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    loadSavedCalibration();
  }, []);

  const loadSavedCalibration = async () => {
    const saved = await loadCalibration();
    if (saved) {
      setCalibration(saved);
    }
  };

  const handleTrajectorySelect = useCallback(
    (name: string) => {
      setSelectedTrajectory(name);
      selectTrajectory(name);
    },
    [selectTrajectory]
  );

  const handleRecordPress = useCallback(() => {
    if (isRecording) {
      const trajectory = stopRecording();
      if (trajectory) {
        const decision = analyzeLBW(trajectory);
        navigation.navigate('Result', {trajectory, decision});
      }
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, navigation]);

  const formatTrajectoryName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <View style={styles.container}>
      <CameraView>
        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording</Text>
            <Text style={styles.detectionCount}>{detectionCount} detections</Text>
          </View>
        )}

        {/* Trajectory selector (when not recording) */}
        {!isRecording && (
          <View style={styles.trajectorySelector}>
            <Text style={styles.selectorTitle}>Select Test Trajectory</Text>
            <View style={styles.trajectoryButtons}>
              {availableTrajectories.map(name => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.trajectoryButton,
                    selectedTrajectory === name && styles.trajectoryButtonActive,
                  ]}
                  onPress={() => handleTrajectorySelect(name)}>
                  <Text
                    style={[
                      styles.trajectoryButtonText,
                      selectedTrajectory === name &&
                        styles.trajectoryButtonTextActive,
                    ]}>
                    {formatTrajectoryName(name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {!isRecording && (
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Position phone at ground level facing stumps
            </Text>
            <Text style={styles.instructionSubtext}>
              Press the button to start simulated ball delivery
            </Text>
          </View>
        )}
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.backButton]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonRecording,
          ]}
          onPress={handleRecordPress}>
          <View
            style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerRecording,
            ]}
          />
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  detectionCount: {
    color: '#fff',
    fontSize: 14,
  },
  trajectorySelector: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 12,
  },
  selectorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  trajectoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  trajectoryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  trajectoryButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#4caf50',
  },
  trajectoryButtonText: {
    color: '#aaa',
    fontSize: 12,
  },
  trajectoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordButtonRecording: {
    borderColor: '#ff4444',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4444',
  },
  recordButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  placeholder: {
    width: 50,
  },
});
