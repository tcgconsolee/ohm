import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image, Text, Dimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';

const CIRCLE_SIZE = 140;
const RADIUS = CIRCLE_SIZE / 2 - 4;
const CENTER = CIRCLE_SIZE / 2;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WATERMARK_FONT_SIZE = SCREEN_WIDTH * 0.47;

interface SplashScreenProps {
  onFinished: () => void;
  durationMs?: number;
}

// Repeating "OHM" text watermark pattern, matching the mockup's background.
function OhmWatermark({ color }: { color: string }) {
  const rows = 10;
  return (
    <View style={styles.watermarkWrap} pointerEvents="none">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.watermarkRowContainer}>
          <Text style={[styles.watermarkRow, { color }]}>OHM</Text>
        </View>
      ))}
    </View>
  );
}

// Builds an SVG path for a pie-slice wedge from 0deg (12 o'clock) sweeping
// clockwise to `angleDeg` - matches Figma's arc/sweep tool style reveal.
function describeWedge(angleDeg: number): string {
  if (angleDeg <= 0) return '';
  if (angleDeg >= 360) {
    return `M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - 0.01} ${CENTER - RADIUS} Z`;
  }
  const startAngleRad = (-90 * Math.PI) / 180;
  const endAngleRad = ((angleDeg - 90) * Math.PI) / 180;

  const startX = CENTER + RADIUS * Math.cos(startAngleRad);
  const startY = CENTER + RADIUS * Math.sin(startAngleRad);
  const endX = CENTER + RADIUS * Math.cos(endAngleRad);
  const endY = CENTER + RADIUS * Math.sin(endAngleRad);

  const largeArcFlag = angleDeg > 180 ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

export default function SplashScreen({ onFinished, durationMs = 1800 }: SplashScreenProps) {
  const theme = useTheme();
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const listenerId = sweepAnim.addListener(({ value }) => {
      setSweepAngle(value);
    });

    Animated.timing(sweepAnim, {
      toValue: 360,
      duration: durationMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      sweepAnim.removeListener(listenerId);
      onFinished();
    });

    return () => {
      sweepAnim.removeListener(listenerId);
    };
  }, [sweepAnim, durationMs, onFinished]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OhmWatermark color={theme.mode === 'dark' ? '#FFFFFF14' : '#00000014'} />
      <Image
        source={require('../assets/noise.png')}
        style={[styles.noiseBackground, { opacity: theme.mode === 'dark' ? 0.12 : 0.35 }]}
        resizeMode="cover"
      />

      <View style={styles.circleWrap}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={theme.textPrimary}
            strokeWidth={1.5}
            fill="none"
            opacity={0.5}
          />
          <Path d={describeWedge(sweepAngle)} fill={theme.buttonPrimaryText} />
        </Svg>
        <View style={styles.logoWrap}>
          <Image source={theme.logo} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  watermarkWrap: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-evenly',
    overflow: 'hidden',
  },
  watermarkRowContainer: {
    flexDirection: 'row',
    width: '100%',
    overflow: 'visible',
    justifyContent: 'center',
  },
  watermarkRow: {
    fontSize: WATERMARK_FONT_SIZE,
    lineHeight: 0.8 * WATERMARK_FONT_SIZE,
    fontFamily: 'Gilroy-Black',
    letterSpacing: 4,
    textAlign: 'center',
    width: SCREEN_WIDTH * 1.5,
  },
  noiseBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 52, height: 52 * (181 / 103) },
});