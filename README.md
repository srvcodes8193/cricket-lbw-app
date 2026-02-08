# Cricket LBW Decision Support App

A React Native mobile application that provides LBW (Leg Before Wicket) decision support for cricket. This MVP uses simulated ball detection to demonstrate the full LBW analysis pipeline.

## Features

- **Camera Integration**: Live camera view using react-native-vision-camera
- **Pitch Calibration**: Mark stumps position for coordinate transformation
- **Ball Tracking**: Simulated ball detection with multiple test trajectories
- **Trajectory Analysis**: Physics-based trajectory fitting and projection
- **LBW Decision Engine**: Full implementation of cricket LBW rules
- **Visual Feedback**: SVG-based trajectory visualization with decision display

## Project Structure

```
cricket-lbw-app/
├── src/
│   ├── components/
│   │   ├── CameraView.tsx          # Camera preview component
│   │   ├── CalibrationOverlay.tsx  # Calibration guides
│   │   ├── TrajectoryOverlay.tsx   # Ball path visualization
│   │   └── DecisionDisplay.tsx     # LBW decision card
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Main menu
│   │   ├── CalibrationScreen.tsx   # Pitch setup
│   │   ├── CameraScreen.tsx        # Recording screen
│   │   └── ResultScreen.tsx        # Decision display
│   ├── services/
│   │   ├── ballDetector.ts         # Mock ball detection
│   │   ├── trajectoryAnalyzer.ts   # Trajectory fitting
│   │   ├── lbwEngine.ts            # LBW decision logic
│   │   └── calibration.ts          # Calibration management
│   ├── hooks/
│   │   └── useBallTracking.ts      # Ball tracking state
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   └── utils/
│       ├── geometry.ts             # Coordinate math
│       └── physics.ts              # Trajectory physics
├── App.tsx                         # Navigation setup
└── package.json
```

## Prerequisites

- Node.js 20+
- React Native CLI
- Android SDK (for Android build)
- Xcode (for iOS build, Mac only)

## Installation

```bash
# Navigate to project
cd cricket-lbw-app

# Install dependencies
npm install

# For iOS (Mac only)
cd ios && pod install && cd ..
```

## Running the App

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

### iOS (Mac only)

```bash
npm run ios
```

## Usage

1. **Calibrate**: On first launch, tap "Calibrate" and mark the four corners of the stumps
2. **Select Trajectory**: Choose a test trajectory (hitting middle, missing off, etc.)
3. **Record**: Press the record button to start the simulated ball delivery
4. **View Decision**: See the LBW analysis with trajectory visualization

## Test Trajectories

The app includes several pre-configured trajectories for testing:

| Trajectory | Expected Result |
|------------|----------------|
| Hitting Middle | OUT |
| Hitting Leg | OUT |
| Outside Leg | NOT OUT (pitched outside leg) |
| Missing Off | NOT OUT (missing stumps) |
| Going Over | NOT OUT (missing stumps) |

## Technical Details

### Coordinate System

- **Origin**: Center of crease at batting end
- **X-axis**: Left to right (off to leg for right-hander)
- **Y-axis**: Towards bowler (0 = stumps, 20.12m = bowling crease)
- **Z-axis**: Height from ground

### LBW Rules Implemented

1. Ball pitching outside leg stump → NOT OUT
2. Impact outside off stump line (with shot played) → NOT OUT
3. Ball missing stumps → NOT OUT
4. Ball clipping stumps → UMPIRE'S CALL
5. All conditions met → OUT

## Future Enhancements

- [ ] Real ML ball detection with TensorFlow Lite
- [ ] Spin detection and trajectory adjustment
- [ ] Multiple camera angles
- [ ] Historical decision storage
- [ ] Share/export functionality

## Dependencies

- react-native-vision-camera - Camera access
- react-native-reanimated - Animations
- @react-navigation/native - Navigation
- react-native-svg - Trajectory graphics
- @react-native-async-storage/async-storage - Calibration storage

## Troubleshooting

If you're having issues getting the above steps to work, see the [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## License

MIT
