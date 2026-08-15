import { useColorScheme } from 'react-native';

export interface OhmTheme {
  mode: 'light' | 'dark';
  logo: number; // require() result for the correct logo variant (light/dark)
  background: string;
  cardBackground: string;
  cardBackgroundAlt: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBackground: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;
  chipActiveBg: string;
  chipActiveText: string;
  chipInactiveBg: string;
  chipInactiveText: string;
  chipBorder: string;
  riskHigh: string;
  riskElevated: string;
  riskLow: string;
  riskHighTint: string; // translucent variant, for backgrounds/banners tied to a risk tier
  riskElevatedTint: string;
  riskLowTint: string;
  navBarBg: string;
  navActiveTint: string;
  navInactiveTint: string;
}

// Exact palette as specified: #FFF / #000 (light mode fg/bg base),
// #F8F8F8 / #0B0B0B (light/dark backgrounds), #BCBDC1 / #383839 (grays),
// #DE1E1E / #D7D75B / #306C30 (risk tiers: red/yellow/green). Only these
// colors are used anywhere in the app, including their translucent
// (alpha-blended) variants for tinted surfaces - nothing outside this set.

const RISK_RED = '#DE1E1E';
const RISK_YELLOW = '#D7D75B';
const RISK_GREEN = '#306C30';
const GRAY_LIGHT = '#BCBDC1';
const GRAY_DARK = '#383839';

const lightTheme: OhmTheme = {
  mode: 'light',
  logo: require('../assets/logo.png'),
  background: '#F8F8F8',
  cardBackground: '#FFFFFF',
  cardBackgroundAlt: GRAY_LIGHT,
  textPrimary: '#000000',
  textSecondary: '#000000CC', // black at ~80% opacity
  textMuted: '#00000080', // black at 50% opacity
  border: GRAY_LIGHT,
  inputBackground: '#FFFFFF',
  buttonPrimaryBg: '#000000',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#FFFFFF',
  buttonSecondaryText: '#000000',
  buttonSecondaryBorder: GRAY_LIGHT,
  chipActiveBg: '#000000',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#FFFFFF',
  chipInactiveText: '#000000',
  chipBorder: GRAY_LIGHT,
  riskHigh: RISK_RED,
  riskElevated: RISK_YELLOW,
  riskLow: RISK_GREEN,
  riskHighTint: '#DE1E1E26', // ~15% opacity
  riskElevatedTint: '#D7D75B26',
  riskLowTint: '#306C3026',
  navBarBg: GRAY_LIGHT,
  navActiveTint: '#000000',
  navInactiveTint: '#00000080',
};

const darkTheme: OhmTheme = {
  mode: 'dark',
  logo: require('../assets/logo-white.png'),
  background: '#0B0B0B',
  cardBackground: GRAY_DARK,
  cardBackgroundAlt: GRAY_DARK,
  textPrimary: '#FFFFFF',
  textSecondary: '#FFFFFFCC', // white at ~80% opacity
  textMuted: '#FFFFFF80', // white at 50% opacity
  border: GRAY_DARK,
  inputBackground: GRAY_DARK,
  buttonPrimaryBg: '#FFFFFF',
  buttonPrimaryText: '#000000',
  buttonSecondaryBg: GRAY_DARK,
  buttonSecondaryText: '#FFFFFF',
  buttonSecondaryBorder: GRAY_DARK,
  chipActiveBg: '#FFFFFF',
  chipActiveText: '#000000',
  chipInactiveBg: GRAY_DARK,
  chipInactiveText: '#FFFFFF',
  chipBorder: GRAY_DARK,
  riskHigh: RISK_RED,
  riskElevated: RISK_YELLOW,
  riskLow: RISK_GREEN,
  riskHighTint: '#DE1E1E33', // ~20% opacity, slightly stronger on dark bg
  riskElevatedTint: '#D7D75B33',
  riskLowTint: '#306C3033',
  navBarBg: GRAY_DARK,
  navActiveTint: '#FFFFFF',
  navInactiveTint: '#FFFFFF80',
};

// Onboarding-time theme follows the system setting; once onboarded, the
// user's explicit Settings > Appearance choice takes over (see
// ThemeProvider). System detection can fail/return null on some platforms -
// fallback is dark mode per product decision.
export function useSystemTheme(): OhmTheme {
  const scheme = useColorScheme();
  return scheme === 'light' ? lightTheme : darkTheme;
}

export function getTheme(mode: 'light' | 'dark' | 'system', systemScheme: 'light' | 'dark' | null | undefined): OhmTheme {
  if (mode === 'light') return lightTheme;
  if (mode === 'dark') return darkTheme;
  return systemScheme === 'light' ? lightTheme : darkTheme;
}

export { lightTheme, darkTheme };