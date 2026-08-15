import { useCallback, useEffect, useState } from 'react';

import { fetchWeatherWithFallback, computeWeatherFactor, WeatherFactor } from '../core/weather';
import { fetchScheduledOutages, ScheduledOutage } from '../core/outageFeed';
import { computeHistoryFactor, HistoryFactor } from '../core/historyFactor';
import { computeInfrastructureFactor, InfrastructureFactor } from '../core/infrastructureFactor';
import { computeRisk, RiskResult } from '../core/riskEngine';
import { ConfirmationLog, AsyncStoragePersistence, ConfirmedWindow } from '../core/confirmationLog';
import { SUPPORTED_DISTRICTS, findDistrict, loadUserSettings, saveUserSettings, UserSettings } from '../core/userSettings';
import { sendRiskAlert, scheduleConfirmationPrompt } from '../core/notifications';

export const confirmationLog = new ConfirmationLog(new AsyncStoragePersistence());

let lastAlertedTier: string | null = null;

export type PipelineState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      risk: RiskResult;
      weatherFactor: WeatherFactor;
      weatherIsStale: boolean;
      historyFactor: HistoryFactor;
      infrastructureFactor: InfrastructureFactor;
      scheduledOutages: ScheduledOutage[];
      totalLoggedWindows: number;
      unconfirmedWindows: ConfirmedWindow[];
      settings: UserSettings;
    };

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

// Central pipeline hook. Any screen that needs risk data uses this instead
// of duplicating fetch/compute logic - keeps Home, Details, Accuracy, and
// Settings all reading from and writing to the same real, persisted state.
export function useOhmPipeline() {
  const [state, setState] = useState<PipelineState>({ status: 'loading' });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadUserSettings().then((loaded) => {
      setSettings(loaded);
      setSettingsLoaded(true);
    });
  }, []);

  const runPipeline = useCallback(async (currentSettings: UserSettings) => {
    setState({ status: 'loading' });
    try {
      const districtInfo = findDistrict(currentSettings.location.district) ?? SUPPORTED_DISTRICTS[0];

      const weatherResult = await fetchWeatherWithFallback(districtInfo.lat, districtInfo.lon);
      const weatherFactor = computeWeatherFactor(weatherResult.snapshot);

      let scheduledOutages: ScheduledOutage[] = [];
      try {
        scheduledOutages = await fetchScheduledOutages(districtInfo.name);
      } catch (feedErr) {
        console.warn('Outage feed unavailable, continuing without it:', feedErr);
      }

      const confirmedWindows = await confirmationLog.getConfirmed();
      const historyFactor = computeHistoryFactor(confirmedWindows);

      const infrastructureFactor = computeInfrastructureFactor(currentSettings.infrastructure);

      const risk = computeRisk(weatherFactor, historyFactor, infrastructureFactor);

      if (risk.tier !== 'Low') {
        const windowStart = new Date();
        const windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
        await confirmationLog.addPrediction(risk.tier, windowStart, windowEnd);

        if (lastAlertedTier !== risk.tier) {
          lastAlertedTier = risk.tier;
          await sendRiskAlert(risk.tier, risk.explanation);
        }
        const allWindowsForPrompt = await confirmationLog.getAll();
        const justAdded = allWindowsForPrompt[allWindowsForPrompt.length - 1];
        if (justAdded) {
          await scheduleConfirmationPrompt(justAdded.id, risk.tier, windowEnd);
        }
      } else {
        lastAlertedTier = null;
      }

      const allWindows = await confirmationLog.getAll();
      const unconfirmedWindows = allWindows.filter((w) => w.outcome === null);

      setState({
        status: 'ready',
        risk,
        weatherFactor,
        weatherIsStale: weatherResult.isStale,
        historyFactor,
        infrastructureFactor,
        scheduledOutages,
        totalLoggedWindows: allWindows.length,
        unconfirmedWindows,
        settings: currentSettings,
      });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  useEffect(() => {
    if (settingsLoaded) {
      runPipeline(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

  const refresh = useCallback(() => runPipeline(settings), [runPipeline, settings]);

  const updateSettings = useCallback(
    async (updated: UserSettings) => {
      setSettings(updated);
      await saveUserSettings(updated);
      await runPipeline(updated);
    },
    [runPipeline]
  );

  return { state, refresh, settings, updateSettings };
}