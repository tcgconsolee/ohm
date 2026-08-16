import { InfrastructureInput } from './infrastructureFactor';

// District -> coordinates lookup, scoped to the app's validated first
// target area only. Per the tech spec's Known Limitations section:
// "Tamil Nadu is the data and infrastructure foundation; Coimbatore's
// power-loom sector is the specific, validated first target user group,
// not a claim of statewide relevance." Other districts are intentionally
// not included here - adding them without validating the outage feed
// parsing, weather thresholds, or infrastructure factor against their real
// data would be scope creep beyond what this project's research supports.
export interface DistrictOption {
  name: string;
  lat: number;
  lon: number;
}

export const SUPPORTED_DISTRICTS: DistrictOption[] = [
  { name: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
];

export function findDistrict(name: string): DistrictOption | undefined {
  return SUPPORTED_DISTRICTS.find((d) => d.name.toLowerCase() === name.toLowerCase());
}

export interface LocationInput {
  district: string;
  area: string;
  pincode: string;
}

export type RiskTolerance = 'cautious' | 'balanced' | 'minimal';

export interface PreferencesInput {
  riskTolerance: RiskTolerance;
  notificationsOn: boolean;
  quietHoursOn: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "06:00"
}

// Persisted user settings - the full onboarding field set, all editable
// afterward from Settings (matches the mockup's "Your info" section
// containing the same fields collected during onboarding).
export interface UserSettings {
  location: LocationInput;
  businessType: string;
  infrastructure: InfrastructureInput;
  preferences: PreferencesInput;
}

const SETTINGS_KEY = 'ohm:userSettings';
const DEFAULT_SETTINGS: UserSettings = {
  location: { district: 'Coimbatore', area: '', pincode: '' },
  businessType: '',
  infrastructure: {
    feederType: 'not_sure',
    buildingAgeYears: null,
    priorOutageFrequencyPerMonth: null,
    backupGenerator: 'none',
  },
  preferences: {
    riskTolerance: 'balanced',
    notificationsOn: true,
    quietHoursOn: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
  },
};

export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const district = parsed.location?.district ?? parsed.district;
    if (!district || !findDistrict(district)) {
      // Unknown/corrupted district - fall back to default rather than crash
      return DEFAULT_SETTINGS;
    }
    return {
      location: { ...DEFAULT_SETTINGS.location, ...parsed.location, district },
      businessType: parsed.businessType ?? DEFAULT_SETTINGS.businessType,
      infrastructure: { ...DEFAULT_SETTINGS.infrastructure, ...parsed.infrastructure },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...parsed.preferences },
    };
  } catch (err) {
    console.warn('UserSettings: failed to load, using default', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}