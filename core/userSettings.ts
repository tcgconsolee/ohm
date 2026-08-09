import { InfrastructureInput } from './infrastructureFactor'

export interface DistrictOption {
  name: string;
  lat: number;
  lon: number;
}

// only coimbatore for now, model isnt validated for other districts yet
export const SUPPORTED_DISTRICTS: DistrictOption[] = [
  { name: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
]

export function findDistrict(name: string): DistrictOption | undefined {
  return SUPPORTED_DISTRICTS.find((d) => d.name.toLowerCase() === name.toLowerCase())
}

export interface UserSettings {
  district: string;
  infrastructure: InfrastructureInput;
}

const k1 = 'ohm:userSettings'
const d1: UserSettings = {
  district: 'Coimbatore',
  infrastructure: {
    feederType: 'not_sure',
    buildingAgeYears: null,
    priorOutageFrequencyPerMonth: null,
    backupGenerator: 'none',
  },
}

export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const s = (await import('@react-native-async-storage/async-storage')).default
    const raw = await s.getItem(k1)
    if (!raw) return d1
    const p = JSON.parse(raw)
    if (!p.district || !findDistrict(p.district)) {
      // unknown or corrupted district saved, fall back instead of crashing
      return d1
    }
    return {
      district: p.district,
      infrastructure: p.infrastructure ?? d1.infrastructure,
    }
  } catch (e) {
    console.warn('UserSettings: failed to load, using default', e)
    return d1
  }
}

export async function saveUserSettings(s: UserSettings): Promise<void> {
  const store = (await import('@react-native-async-storage/async-storage')).default
  await store.setItem(k1, JSON.stringify(s))
}