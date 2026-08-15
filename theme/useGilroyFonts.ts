import { useFonts } from 'expo-font';

// Loads every Gilroy weight from /fonts. Font family names match the file
// names exactly (e.g. 'Gilroy-Black', 'Gilroy-SemiBold') so styles can
// reference them directly via fontFamily.
export function useGilroyFonts() {
  return useFonts({
    'Gilroy-Black': require('../fonts/Gilroy-Black.ttf'),
    'Gilroy-BlackItalic': require('../fonts/Gilroy-BlackItalic.ttf'),
    'Gilroy-Bold': require('../fonts/Gilroy-Bold.ttf'),
    'Gilroy-BoldItalic': require('../fonts/Gilroy-BoldItalic.ttf'),
    'Gilroy-ExtraBold': require('../fonts/Gilroy-ExtraBold.ttf'),
    'Gilroy-ExtraBoldItalic': require('../fonts/Gilroy-ExtraBoldItalic.ttf'),
    'Gilroy-Heavy': require('../fonts/Gilroy-Heavy.ttf'),
    'Gilroy-HeavyItalic': require('../fonts/Gilroy-HeavyItalic.ttf'),
    'Gilroy-Light': require('../fonts/Gilroy-Light.ttf'),
    'Gilroy-LightItalic': require('../fonts/Gilroy-LightItalic.ttf'),
    'Gilroy-Medium': require('../fonts/Gilroy-Medium.ttf'),
    'Gilroy-MediumItalic': require('../fonts/Gilroy-MediumItalic.ttf'),
    'Gilroy-Regular': require('../fonts/Gilroy-Regular.ttf'),
    'Gilroy-RegularItalic': require('../fonts/Gilroy-RegularItalic.ttf'),
    'Gilroy-SemiBold': require('../fonts/Gilroy-SemiBold.ttf'),
    'Gilroy-SemiBoldItalic': require('../fonts/Gilroy-SemiBoldItalic.ttf'),
    'Gilroy-Thin': require('../fonts/Gilroy-Thin.ttf'),
    'Gilroy-ThinItalic': require('../fonts/Gilroy-ThinItalic.ttf'),
    'Gilroy-UltraLight': require('../fonts/Gilroy-UltraLight.ttf'),
    'Gilroy-UltraLightItalic': require('../fonts/Gilroy-UltraLightItalic.ttf'),
  });
}