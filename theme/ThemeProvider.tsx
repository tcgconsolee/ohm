import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getTheme, OhmTheme } from './theme';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREF_KEY = 'ohm:themePreference';

async function getAsyncStorage() {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
}

interface ThemeContextValue {
  theme: OhmTheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = await getAsyncStorage();
        const stored = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      } catch (err) {
        console.warn('ThemeProvider: failed to load stored preference, using system default', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    getAsyncStorage()
      .then((AsyncStorage) => AsyncStorage.setItem(THEME_PREF_KEY, pref))
      .catch((err) => console.warn('ThemeProvider: failed to persist preference', err));
  };

  // Onboarding-time (and default) behavior follows system scheme; if the
  // system scheme can't be read (null/undefined/'unspecified' on some
  // platforms), the fallback is dark mode - matches the product decision.
  const normalizedSystemScheme = systemScheme === 'light' || systemScheme === 'dark' ? systemScheme : null;
  const theme = getTheme(preference, normalizedSystemScheme);

  if (!loaded) {
    // Render nothing meaningful before the stored preference is known -
    // avoids a flash of the wrong theme. This resolves near-instantly in
    // practice since AsyncStorage reads are fast.
    return null;
  }

  return <ThemeContext.Provider value={{ theme, preference, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): OhmTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx.theme;
}

export function useThemePreference(): { preference: ThemePreference; setPreference: (pref: ThemePreference) => void } {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within a ThemeProvider');
  }
  return { preference: ctx.preference, setPreference: ctx.setPreference };
}