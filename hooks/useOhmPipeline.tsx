import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

import { fetchWeatherWithFallback, computeWeatherFactor, findWeatherWindow, WeatherFactor } from '../core/weather';
import { fetchScheduledOutagesWithFallback, prefetchScheduledOutages, matchesLocality, getOutageDateRange, ScheduledOutage } from '../core/outageFeed';
import { computeHistoryFactor, HistoryFactor } from '../core/historyFactor';
import { computeInfrastructureFactor, InfrastructureFactor } from '../core/infrastructureFactor';
import { computeRisk, RiskResult } from '../core/riskEngine';
import { ConfirmationLog, AsyncStoragePersistence, ConfirmedWindow } from '../core/confirmationLog';
import { SUPPORTED_DISTRICTS, findDistrict, loadUserSettings, saveUserSettings, UserSettings } from '../core/userSettings';
import { sendRiskAlert, scheduleConfirmationPrompt } from '../core/notifications';

export const confirmationLog = new ConfirmationLog(new AsyncStoragePersistence());

let lastAlertedTier: string | null = null;
// Tracks windowEnd (ISO string) of the last risk window a confirmation
// prompt was scheduled for - scheduleConfirmationPrompt previously had no
// gate at all, so every pipeline run (app open, pull-to-refresh, settings
// change) scheduled a brand new prompt even when the risk window hadn't
// changed, stacking up multiple "Did the power go out?" notifications for
// the same real-world time period.
let lastPromptedWindowEnd: string | null = null;

// "HH:MM" -> minutes since midnight, in local time (matches the picker in
// Settings/Onboarding, which stores plain local wall-clock strings).
function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h % 24) * 60 + (m % 60);
}

// Quiet hours can wrap past midnight (e.g. 22:00-06:00), so a simple
// start <= now <= end check isn't enough - handle both cases.
function isWithinQuietHours(prefs: UserSettings['preferences'], now: Date = new Date()): boolean {
  if (!prefs.quietHoursOn) return false;
  const start = parseTimeToMinutes(prefs.quietHoursStart);
  const end = parseTimeToMinutes(prefs.quietHoursEnd);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false; // zero-length window, treat as no quiet hours
  if (start < end) {
    return nowMinutes >= start && nowMinutes < end;
  }
  // wraps past midnight
  return nowMinutes >= start || nowMinutes < end;
}

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
      scheduledOutagesIsStale: boolean;
      totalLoggedWindows: number;
      unconfirmedWindows: ConfirmedWindow[];
      settings: UserSettings;
      // The risk window's real start/end, grounded in whichever signal is
      // dominant (scheduled outage's own times, weather forecast window, or
      // a fixed default) - null when risk is Low, since no window is
      // computed in that case.
      riskWindow: { start: string; end: string } | null;
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

// Internal implementation - holds the actual pipeline state and network
// logic. Not exported directly; screens should use the OhmPipelineProvider
// + useOhmPipeline() context pair below instead, so only one instance of
// this runs for the whole app rather than one per screen.
function useOhmPipelineInternal(enabled: boolean) {
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

      const outageFeedResult = await fetchScheduledOutagesWithFallback(districtInfo.name);
      const scheduledOutages: ScheduledOutage[] = outageFeedResult.outages;
      const scheduledOutagesIsStale = outageFeedResult.isStale;

      // Best-effort background refresh of today + next 2 days, so the cache
      // stays warm ahead of time - not awaited, since this shouldn't block
      // the pipeline render, and its own failures are already handled
      // internally.
      prefetchScheduledOutages(districtInfo.name, 3).catch(() => {});

      const confirmedWindows = await confirmationLog.getConfirmed();
      const historyFactor = computeHistoryFactor(confirmedWindows);

      const infrastructureFactor = computeInfrastructureFactor(currentSettings.infrastructure);

      let risk = computeRisk(weatherFactor, historyFactor, infrastructureFactor, currentSettings.preferences.riskTolerance);

      // A scheduled outage confirmed for the user's own locality is closer
      // to a known fact than a heuristic estimate - it overrides the
      // computed tier to High rather than just nudging the weighted score,
      // since previously this data was fetched but never used at all.
      const matchedOutage = scheduledOutages.find((o) =>
        matchesLocality(o, currentSettings.location.area, currentSettings.location.pincode)
      );
      if (matchedOutage && risk.tier !== 'High') {
        risk = {
          ...risk,
          tier: 'High',
          explanation: `Scheduled outage reported for your area (${matchedOutage.startTime}-${matchedOutage.endTime}), affecting ${matchedOutage.section}.`,
          dominantFactor: 'history',
          // A confirmed scheduled outage is the clearest possible driver of
          // "maintenance" risk - reflect that in the ring's contributions
          // too, not just the tier/explanation, so the two don't disagree.
          contributions: {
            ...risk.contributions,
            history: Math.max(risk.contributions.history, risk.contributions.weather + risk.contributions.infrastructure + 0.01),
          },
        };
      }

      let riskWindow: { start: string; end: string } | null = null;

      if (risk.tier !== 'Low') {
        let windowStart: Date;
        let windowEnd: Date;

        if (matchedOutage) {
          // A confirmed scheduled outage has its own real, stated times -
          // more accurate than any estimate. getOutageDateRange combines
          // the outage's date with its HH:MM start/end (new Date("16:00")
          // alone is always Invalid Date, since it has no date component -
          // this previously silently fell through to the 4h default every
          // single time a scheduled outage matched).
          const range = getOutageDateRange(matchedOutage);
          if (range) {
            windowStart = range.start;
            windowEnd = range.end;
          } else {
            windowStart = new Date();
            windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
          }
        } else if (risk.dominantFactor === 'weather') {
          const weatherWindow = findWeatherWindow(weatherResult.snapshot);
          if (weatherWindow.durationHours > 0) {
            windowStart = new Date(Date.now() + weatherWindow.startsInHours * 60 * 60 * 1000);
            windowEnd = new Date(windowStart.getTime() + weatherWindow.durationHours * 60 * 60 * 1000);
          } else {
            // Weather scored dominant by its forecast-wide peak value, but
            // no single hour in the forecast actually crosses the bad-
            // weather threshold - fall back rather than show "next 0 hours".
            windowStart = new Date();
            windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
          }
        } else {
          // History/infrastructure dominant - neither has a time dimension
          // to ground a duration in, so use the fixed default.
          windowStart = new Date();
          windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
        }

        riskWindow = { start: windowStart.toISOString(), end: windowEnd.toISOString() };

        // riskEngine's score is 0-1; confirmationLog/AccuracyScreen store and
        // render on a 0-100 scale, so convert explicitly at this boundary.
        await confirmationLog.addPrediction(risk.tier, windowStart, windowEnd, Math.round(risk.score * 100));

        const notificationsAllowed =
          currentSettings.preferences.notificationsOn && !isWithinQuietHours(currentSettings.preferences);

        if (notificationsAllowed) {
          if (lastAlertedTier !== risk.tier) {
            lastAlertedTier = risk.tier;
            await sendRiskAlert(risk.tier, risk.explanation);
          }
          const windowEndIso = windowEnd.toISOString();
          if (lastPromptedWindowEnd !== windowEndIso) {
            lastPromptedWindowEnd = windowEndIso;
            const allWindowsForPrompt = await confirmationLog.getAll();
            const justAdded = allWindowsForPrompt[allWindowsForPrompt.length - 1];
            if (justAdded) {
              await scheduleConfirmationPrompt(justAdded.id, risk.tier, windowEnd);
            }
          }
        } else if (lastAlertedTier !== risk.tier) {
          // Still track tier changes even when the notification itself is
          // suppressed, so a real alert can fire the moment quiet hours end
          // or notifications are re-enabled, instead of staying silent
          // because lastAlertedTier was never updated.
          lastAlertedTier = risk.tier;
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
        scheduledOutagesIsStale,
        totalLoggedWindows: allWindows.length,
        unconfirmedWindows,
        settings: currentSettings,
        riskWindow,
      });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  useEffect(() => {
    if (settingsLoaded && enabled) {
      runPipeline(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded, enabled]);

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

type OhmPipelineContextValue = ReturnType<typeof useOhmPipelineInternal>;

const OhmPipelineContext = createContext<OhmPipelineContextValue | null>(null);

// Mount once near the app root (in App.tsx) so every screen that consumes
// useOhmPipeline() shares the same underlying state and network calls,
// instead of each screen independently re-fetching everything on its own
// mount. `enabled` gates the automatic network fetch (e.g. pass
// phase === 'main' so it doesn't start hitting the network with default
// settings during splash/onboarding, before the user has entered their
// real location) - defaults to true for callers that don't need to gate it.
export function OhmPipelineProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const value = useOhmPipelineInternal(enabled);
  return <OhmPipelineContext.Provider value={value}>{children}</OhmPipelineContext.Provider>;
}

// Same public API as before ({ state, refresh, settings, updateSettings })
// so existing screen code using useOhmPipeline() doesn't need to change -
// only the import source moves from a per-screen hook call to a shared
// context read.
export function useOhmPipeline(): OhmPipelineContextValue {
  const ctx = useContext(OhmPipelineContext);
  if (!ctx) {
    throw new Error('useOhmPipeline must be used within an OhmPipelineProvider');
  }
  return ctx;
}