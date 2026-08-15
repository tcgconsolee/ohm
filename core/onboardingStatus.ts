const ONBOARDING_KEY = 'ohm:onboardingComplete';

async function getAsyncStorage() {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
}

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const AsyncStorage = await getAsyncStorage();
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (err) {
    console.warn('Onboarding: failed to read completion status, assuming not complete', err);
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  const AsyncStorage = await getAsyncStorage();
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}