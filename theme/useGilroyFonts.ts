import { useFonts } from 'expo-font';

// Loads only the Gilroy weights actually referenced in styles across the
// app (Black, Bold, Heavy, Medium, Regular, SemiBold). Previously loaded
// all 20 weights including italics, ExtraBold, Light, Thin, and UltraLight
// variants that were never used anywhere - ~2MB of dead weight bundled and
// loaded into memory at every app start for no visual benefit.
export function useGilroyFonts() {
  return useFonts({
    'Gilroy-Black': require('../fonts/Gilroy-Black.ttf'),
    'Gilroy-Bold': require('../fonts/Gilroy-Bold.ttf'),
    'Gilroy-Heavy': require('../fonts/Gilroy-Heavy.ttf'),
    'Gilroy-Medium': require('../fonts/Gilroy-Medium.ttf'),
    'Gilroy-Regular': require('../fonts/Gilroy-Regular.ttf'),
    'Gilroy-SemiBold': require('../fonts/Gilroy-SemiBold.ttf'),
  });
}