import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';


interface Props {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

// The real Ohm logo mark, used everywhere the ⚡ placeholder was previously
// used (splash screen, Home header, onboarding step headers, disclosure).
export default function OhmLogo({ size = 22, style }: Props) {
  const theme = useTheme();
  return (
    <Image
      source={theme.logo}
      style={[{ width: size, height: size * (181 / 103) }, style]}
      resizeMode="contain"
    />
  );
}