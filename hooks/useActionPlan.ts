import { useCallback, useEffect, useState } from 'react';

const ACTION_PLAN_KEY = 'ohm:actionPlan';

export interface ActionPlanStep {
  text: string;
  done: boolean;
}

async function getAsyncStorage() {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
}

export async function loadActionPlan(): Promise<ActionPlanStep[]> {
  try {
    const AsyncStorage = await getAsyncStorage();
    const raw = await AsyncStorage.getItem(ACTION_PLAN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Backward compatible with the old string[] shape (no completion state
    // existed yet) - treat any legacy plain-string entries as not done.
    return parsed
      .map((item) => {
        if (typeof item === 'string') return { text: item, done: false };
        if (item && typeof item.text === 'string') return { text: item.text, done: !!item.done };
        return null;
      })
      .filter((item): item is ActionPlanStep => item !== null && item.text.trim() !== '');
  } catch (err) {
    console.warn('ActionPlan: failed to load, starting empty', err);
    return [];
  }
}

export async function saveActionPlan(steps: ActionPlanStep[]): Promise<void> {
  const AsyncStorage = await getAsyncStorage();
  // Only persist non-blank steps - a blank step field is treated as removed,
  // matching the earlier design decision (steps 3-4 can be cleared to
  // remove them; steps 1-2 are required and enforced at the UI layer).
  const cleaned = steps
    .map((s) => ({ text: s.text.trim(), done: s.done }))
    .filter((s) => s.text !== '');
  await AsyncStorage.setItem(ACTION_PLAN_KEY, JSON.stringify(cleaned));
}

export function useActionPlan() {
  const [plan, setPlan] = useState<ActionPlanStep[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadActionPlan().then((steps) => {
      setPlan(steps);
      setLoaded(true);
    });
  }, []);

  // Saves a full replacement plan (used by the create/edit screen, which
  // works with a plain string[] of step text - completion always resets to
  // false there, since editing step text logically resets progress).
  const save = useCallback(async (stepTexts: string[]) => {
    const cleaned: ActionPlanStep[] = stepTexts
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map((text) => ({ text, done: false }));
    await saveActionPlan(cleaned);
    setPlan(cleaned);
  }, []);

  // Toggles a single step's completion state by index, persisting
  // immediately - this is what the Home screen's tappable checkboxes call.
  const toggleStep = useCallback(
    async (index: number) => {
      setPlan((current) => {
        const updated = current.map((step, i) => (i === index ? { ...step, done: !step.done } : step));
        saveActionPlan(updated).catch((err) => console.warn('Failed to persist step toggle', err));
        return updated;
      });
    },
    []
  );

  return { plan, loaded, save, toggleStep };
}