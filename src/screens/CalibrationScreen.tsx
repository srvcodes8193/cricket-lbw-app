import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, CalibrationData, Point2D} from '../types';
import {CameraView} from '../components/CameraView';
import {CalibrationOverlay} from '../components/CalibrationOverlay';
import {
  getDefaultCalibration,
  createCalibration,
  saveCalibration,
  validateCalibration,
} from '../services/calibration';

type CalibrationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Calibration'
>;

interface CalibrationScreenProps {
  navigation: CalibrationScreenNavigationProp;
}

const CALIBRATION_KEYS: (keyof CalibrationData)[] = [
  'stumpsTopLeft',
  'stumpsTopRight',
  'stumpsBottomLeft',
  'stumpsBottomRight',
];

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  navigation,
}) => {
  const [calibration, setCalibration] = useState<CalibrationData>(
    getDefaultCalibration()
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleTap = useCallback(
    (event: {nativeEvent: {locationX: number; locationY: number}}) => {
      if (currentStep >= CALIBRATION_KEYS.length) return;

      const point: Point2D = {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      };

      const key = CALIBRATION_KEYS[currentStep];
      setCalibration(prev => ({
        ...prev,
        [key]: point,
      }));
      setCurrentStep(prev => prev + 1);
    },
    [currentStep]
  );

  const handleReset = () => {
    setCalibration(getDefaultCalibration());
    setCurrentStep(0);
  };

  const handleSave = async () => {
    // Create calibration with all points
    const finalCalibration = createCalibration(
      calibration.stumpsTopLeft,
      calibration.stumpsTopRight,
      calibration.stumpsBottomLeft,
      calibration.stumpsBottomRight
    );

    // Validate
    const {isValid, errors} = validateCalibration(finalCalibration);

    if (!isValid) {
      Alert.alert('Validation Error', errors.join('\n'), [
        {text: 'OK', onPress: handleReset},
      ]);
      return;
    }

    // Save
    setIsSaving(true);
    try {
      await saveCalibration(finalCalibration);
      Alert.alert('Success', 'Calibration saved successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save calibration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    if (currentStep === 0) return;

    const key = CALIBRATION_KEYS[currentStep - 1];
    setCalibration(prev => ({
      ...prev,
      [key]: {x: 0, y: 0},
    }));
    setCurrentStep(prev => prev - 1);
  };

  const isComplete = currentStep >= CALIBRATION_KEYS.length;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.cameraContainer}>
          <CameraView>
            <CalibrationOverlay
              calibration={calibration}
              currentStep={currentStep}
            />
          </CameraView>
        </View>
      </TouchableWithoutFeedback>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleReset}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              currentStep === 0 && styles.buttonDisabled,
            ]}
            onPress={handleUndo}
            disabled={currentStep === 0}>
            <Text style={styles.buttonText}>Undo</Text>
          </TouchableOpacity>
        </View>

        {isComplete && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSave}
            disabled={isSaving}>
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : 'Save Calibration'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#333',
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
