import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { loadUserSettings, saveUserSettings, UserSettings } from '../../core/userSettings';
import HelloStep from './HelloStep';
import LocationStep from './LocationStep';
import InfrastructureStep from './InfrastructureStep';
import PreferencesStep from './PreferencesStep';
import DisclosureStep from './DisclosureStep';

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [step, setStep] = useState(1);

  // 1. Hook reads local storage immediately on component mount
  useEffect(() => {
    loadUserSettings().then((data) => {
      setSettings(data);
    });
  }, []);

  if (!settings) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0B0B' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // 2. High-Fidelity Persisted Mutator Action Callback:
  // Instead of floating in temporary memory variables, this commits input updates directly back to device storage arrays!
  const updateStepAndPersistData = async (updatedFields: Partial<UserSettings>, nextStepIndex: number) => {
    try {
      const mergedConfig = { ...settings, ...updatedFields };
      setSettings(mergedConfig); // Safe reactive local paint sync step pass
      await saveUserSettings(mergedConfig); // COMMITS VALUE DIRECTLY TO ASYNCSTORAGE FLUSHING PARAMS
      setStep(nextStepIndex); // Transitions step view phase frame safely once write finishes
    } catch (err) {
      console.warn('OnboardingFlow: Failed to conserve state data across transitions', err);
      setStep(nextStepIndex); // Fallback safety step jump
    }
  };

  const handleFinishOnboarding = async () => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('ohm:onboardingComplete', 'true');
    onComplete();
  };
  // 3. Child Screen Step Multiplier Routing Conditions Matrix
  if (step === 1) {
    return (
      <HelloStep 
        onOkay={() => setStep(2)} 
        onUnsure={() => setStep(6)} // Routes right to Unsure view step context
      />
    );
  }

  if (step === 2) {
    return (
      <LocationStep
        data={settings.location}
        // Passes dynamic change handlers back into the memory matrix path
        onChange={(loc) => setSettings({ ...settings, location: loc })}
        onNext={() => updateStepAndPersistData({ location: settings.location }, 3)}
      />
    );
  }

  if (step === 3) {
    return (
      <InfrastructureStep
        data={settings.infrastructure}
        onChange={(infra) => setSettings({ ...settings, infrastructure: infra })}
        onNext={() => updateStepAndPersistData({ infrastructure: settings.infrastructure }, 4)}
        onBack={() => setStep(2)}
      />
    );
  }

  if (step === 4) {
    return (
      <PreferencesStep
        data={settings.preferences}
        onChange={(prefs) => setSettings({ ...settings, preferences: prefs })}
        onNext={() => updateStepAndPersistData({ preferences: settings.preferences }, 5)}
        onBack={() => setStep(3)}
      />
    );
  }

  if (step === 5) {
    return (
      <DisclosureStep
        onNext={handleFinishOnboarding}
        onBack={() => setStep(4)}
      />
    );
  }

  // Fallback safety terminal state container
  return null;
}
