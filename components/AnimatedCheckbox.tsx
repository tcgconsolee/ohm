import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, Animated } from 'react-native';
import { Circle, Rect, ClipPath, Defs, G, Svg } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

// Checkbox with a radial fill that grows from the center outward when
// checked (not a plain color-flip) - matches the requested "radial
// transition filling from inside" behavior. Unchecked state is a solid
// white fill with a border, not transparent.
export default function AnimatedCheckbox({ checked, onPress, size = 18 }: Props) {
  const theme = useTheme();
  const fillRadius = useRef(new Animated.Value(checked ? size : 0)).current;
  // Deliberately oversized so the clip path (the box itself) is always the
  // limiting factor, not the circle's exact radius - avoids relying on
  // precise corner-distance math that left a visible gap at this size.
  const maxRadius = size * 1.5;

  useEffect(() => {
    Animated.timing(fillRadius, {
      toValue: checked ? maxRadius : 0,
      duration: 220,
      useNativeDriver: false, // radius-driven SVG animation can't use native driver
    }).start();
  }, [checked, fillRadius, maxRadius]);

  const center = size / 2;

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View style={[styles.wrap, { width: size, height: size, borderColor: theme.textPrimary }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Base fill - solid white, always present underneath */}
          <Rect x={0} y={0} width={size} height={size} fill={theme.buttonPrimaryText} />
          {/* Radial fill that grows from center when checked. Clipping to
              the rounded box is handled entirely by the outer View's
              overflow: 'hidden' + borderRadius below - react-native-svg's
              clipPath on a rounded Rect was unreliable on web and left a
              visible sliver uncovered, so it's not used here. */}
          <AnimatedCircle cx={center} cy={center} r={fillRadius} fill={theme.textPrimary} />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderRadius: 4,
    overflow: 'hidden',
  },
});