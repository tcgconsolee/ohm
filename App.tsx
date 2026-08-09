import { useCallback, useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, Pressable, TextInput } from 'react-native'

import { fetchWeatherWithFallback, computeWeatherFactor, WeatherFactor } from './core/weather'
import { fetchScheduledOutages, ScheduledOutage } from './core/outageFeed'
import { computeHistoryFactor, HistoryFactor } from './core/historyFactor'
import { computeInfrastructureFactor, InfrastructureFactor, InfrastructureInput, FeederType } from './core/infrastructureFactor'
import { computeRisk, RiskResult } from './core/riskEngine'
import { ConfirmationLog, AsyncStoragePersistence, ConfirmedWindow } from './core/confirmationLog'
import { SUPPORTED_DISTRICTS, findDistrict, loadUserSettings, saveUserSettings } from './core/userSettings'
import { sendRiskAlert, scheduleConfirmationPrompt } from './core/notifications'

const g1 = new ConfirmationLog(new AsyncStoragePersistence())

// last tier I alerted on, avoids spamming notifs
let g2: string | null = null

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      risk: RiskResult
      weatherFactor: WeatherFactor
      weatherIsStale: boolean
      historyFactor: HistoryFactor
      infrastructureFactor: InfrastructureFactor
      scheduledOutageCount: number
      totalLoggedWindows: number
      unconfirmedWindows: ConfirmedWindow[]
    }

function f1(w: ConfirmedWindow): string {
  const s = new Date(w.windowStart)
  const e = new Date(w.windowEnd)
  const fmt = (d: Date) => d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  return `${w.riskLevel} risk window: ${fmt(s)} - ${fmt(e)}`
}

const d1: InfrastructureInput = { feederType: 'not_sure', buildingAgeYears: null, priorOutageFrequencyPerMonth: null, backupGenerator: 'none' }

function FeederChip({ ft, active, onPress }: { ft: FeederType; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {ft === 'not_sure' ? 'Not sure' : ft}
      </Text>
    </Pressable>
  )
}

function FeederChips({ selected, onChange }: { selected: FeederType; onChange: (ft: FeederType) => void }) {
  const options: FeederType[] = ['industrial', 'mixed', 'not_sure']
  return (
    <View style={styles.chipRow}>
      {options.map((ft) => (
        <FeederChip key={ft} ft={ft} active={selected === ft} onPress={() => onChange(ft)} />
      ))}
    </View>
  )
}

function ConfirmRow({ w, disabled, onConfirm }: { w: ConfirmedWindow; disabled: boolean; onConfirm: (outcome: 'outage' | 'no_outage') => void }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{f1(w)}</Text>
      <View style={styles.confirmButtons}>
        <Pressable style={[styles.confirmButton, styles.yesButton]} disabled={disabled} onPress={() => onConfirm('outage')}>
          <Text style={styles.yesButtonText}>Yes</Text>
        </Pressable>
        <Pressable style={[styles.confirmButton, styles.noButton]} disabled={disabled} onPress={() => onConfirm('no_outage')}>
          <Text style={styles.noButtonText}>No</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [confirming, setConfirming] = useState<string | null>(null)
  const [district] = useState<string>('Coimbatore') // only validated district so far
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [infrastructure, setInfrastructure] = useState<InfrastructureInput>(d1)

  const [reportDate, setReportDate] = useState('')
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportStatus, setReportStatus] = useState<string | null>(null)

  useEffect(() => {
    loadUserSettings().then((s) => {
      setInfrastructure(s.infrastructure)
      setSettingsLoaded(true)
    })
  }, [])

  const runPipeline = useCallback(async (infra: InfrastructureInput) => {
    setState({ status: 'loading' })
    try {
      const d = findDistrict(district) ?? SUPPORTED_DISTRICTS[0]

      const w = await fetchWeatherWithFallback(d.lat, d.lon)
      const weatherFactor = computeWeatherFactor(w.snapshot)

      // nammamap feed flakes out sometimes, dont block risk calc on it
      let scheduled: ScheduledOutage[] = []
      try {
        scheduled = await fetchScheduledOutages(d.name)
      } catch (e) {
        console.warn('Outage feed unavailable, continuing without it:', e)
      }

      const confirmed = await g1.getConfirmed()
      const historyFactor = computeHistoryFactor(confirmed)

      const infrastructureFactor = computeInfrastructureFactor(infra)

      const risk = computeRisk(weatherFactor, historyFactor, infrastructureFactor)

      if (risk.tier !== 'Low') {
        // dont spawn a new window if one for this tier is already open and hasnt ended yet
        const existing = await g1.getAll()
        const now = Date.now()
        const alreadyOpen = existing.some(
          (x) => x.outcome === null && new Date(x.windowEnd).getTime() > now
        )

        if (!alreadyOpen) {
          // 4hr window = how long elevated/high risk stays relevant
          const start = new Date()
          const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
          await g1.addPrediction(risk.tier, start, end)

          if (g2 !== risk.tier) {
            g2 = risk.tier
            await sendRiskAlert(risk.tier, risk.explanation)
          }
          const all = await g1.getAll()
          const last = all[all.length - 1]
          if (last) {
            await scheduleConfirmationPrompt(last.id, risk.tier, end)
          }
        }
      } else {
        // low risk again, reset so next spike alerts
        g2 = null
      }

      const all = await g1.getAll()
      const unconfirmed = all.filter((x) => x.outcome === null)

      setState({
        status: 'ready',
        risk,
        weatherFactor,
        weatherIsStale: w.isStale,
        historyFactor,
        infrastructureFactor,
        scheduledOutageCount: scheduled.length,
        totalLoggedWindows: all.length,
        unconfirmedWindows: unconfirmed,
      })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }, [district])

  useEffect(() => {
    if (settingsLoaded) {
      runPipeline(infrastructure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded])

  const handleConfirm = async (id: string, outcome: 'outage' | 'no_outage') => {
    setConfirming(id)
    try {
      await g1.confirmOutcome(id, outcome, 'post_window_prompt')
      await runPipeline(infrastructure)
    } finally {
      setConfirming(null)
    }
  }

  const handleFeederTypeChange = async (feederType: FeederType) => {
    const u = { ...infrastructure, feederType }
    setInfrastructure(u)
    await saveUserSettings({ district, infrastructure: u })
    await runPipeline(u)
  }

  const handleBuildingAgeChange = async (text: string) => {
    const v = text.trim() === '' ? null : Number(text)
    const u = { ...infrastructure, buildingAgeYears: Number.isNaN(v) ? null : v }
    setInfrastructure(u)
    await saveUserSettings({ district, infrastructure: u })
  }

  const handlePriorFrequencyChange = async (text: string) => {
    const v = text.trim() === '' ? null : Number(text)
    const u = { ...infrastructure, priorOutageFrequencyPerMonth: Number.isNaN(v) ? null : v }
    setInfrastructure(u)
    await saveUserSettings({ district, infrastructure: u })
  }

  const handleApplyInfrastructure = async () => {
    await runPipeline(infrastructure)
  }

  const handleReportOutage = async () => {
    setReportStatus(null)
    if (!reportDate || !reportStart || !reportEnd) {
      setReportStatus('Please fill in date, start time, and end time.')
      return;
    }
    try {
      const s = new Date(`${reportDate}T${reportStart}:00`)
      const e = new Date(`${reportDate}T${reportEnd}:00`)
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        setReportStatus('Could not parse that date/time - use YYYY-MM-DD and HH:MM.')
        return;
      }
      const r = await g1.reportOutage(s, e)
      // if this overlaps a predicted window its a late confirm, not a new miss
      setReportStatus(
        r.matchedExistingWindow
          ? 'Matched an existing predicted window - marked as confirmed, not a new miss.'
          : 'No matching prediction found - logged as a missed outage.'
      )
      setReportDate('')
      setReportStart('')
      setReportEnd('')
      await runPipeline(infrastructure)
    } catch (e) {
      setReportStatus(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ohm - MVP pipeline check</Text>
        <Text style={styles.subtitle}>Coimbatore (validated first target area only)</Text>

        {state.status === 'loading' && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Fetching weather and outage data...</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.block}>
            <Text style={styles.errorLabel}>Something went wrong</Text>
            <Text style={styles.errorText}>{state.message}</Text>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            <View style={styles.riskBlock}>
              <Text style={styles.riskTier}>{state.risk.tier} risk</Text>
              <Text style={styles.riskScore}>score: {state.risk.score.toFixed(2)}</Text>
              <Text style={styles.riskExplanation}>{state.risk.explanation}</Text>
            </View>

            {state.weatherIsStale && (
              <View style={styles.staleBanner}>
                <Text style={styles.staleBannerText}>Live weather unavailable - showing last known data.</Text>
              </View>
            )}

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Weather factor</Text>
              <Text>score: {state.weatherFactor.score.toFixed(2)}</Text>
              <Text>{state.weatherFactor.reason}</Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>History factor</Text>
              <Text>score: {state.historyFactor.score.toFixed(2)}</Text>
              <Text>{state.historyFactor.reason}</Text>
              <Text>sample size: {state.historyFactor.sampleSize}</Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Infrastructure factor</Text>
              <Text>score: {state.infrastructureFactor.score.toFixed(2)}</Text>
              <Text>{state.infrastructureFactor.reason}</Text>

              <Text style={styles.fieldLabel}>Feeder type</Text>
              <FeederChips selected={infrastructure.feederType} onChange={handleFeederTypeChange} />

              <Text style={styles.fieldLabel}>Building/connection age (years)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 15"
                value={infrastructure.buildingAgeYears?.toString() ?? ''}
                onChangeText={handleBuildingAgeChange}
                onBlur={handleApplyInfrastructure}
              />

              <Text style={styles.fieldLabel}>Prior outages per month</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 3"
                value={infrastructure.priorOutageFrequencyPerMonth?.toString() ?? ''}
                onChangeText={handlePriorFrequencyChange}
                onBlur={handleApplyInfrastructure}
              />

              <Pressable style={styles.applyButton} onPress={handleApplyInfrastructure}>
                <Text style={styles.applyButtonText}>Recalculate with these details</Text>
              </Pressable>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Scheduled outages today (Coimbatore)</Text>
              <Text>{state.scheduledOutageCount} entries found via NammaMap feed</Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Confirmation log (persisted on-device)</Text>
              <Text>{state.totalLoggedWindows} total logged windows</Text>
              <Text>{state.unconfirmedWindows.length} awaiting confirmation</Text>
              <Text style={styles.note}>
                Elevated/High windows trigger a local notification and a scheduled confirmation prompt
                (mobile only - not supported on web).
              </Text>
            </View>

            {state.unconfirmedWindows.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Did the power go out?</Text>
                {state.unconfirmedWindows.map((w) => (
                  <ConfirmRow key={w.id} w={w} disabled={confirming === w.id} onConfirm={(outcome) => handleConfirm(w.id, outcome)} />
                ))}
              </View>
            )}

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Report an outage we missed</Text>
              <Text style={styles.note}>
                If we didn't warn you about an outage, log it here. If it matches a window we already
                predicted, it's marked as confirmed. Otherwise it's logged as a genuine miss.
              </Text>
              <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.textInput} placeholder="2026-08-08" value={reportDate} onChangeText={setReportDate} />
              <Text style={styles.fieldLabel}>Start time (HH:MM, 24hr)</Text>
              <TextInput style={styles.textInput} placeholder="14:00" value={reportStart} onChangeText={setReportStart} />
              <Text style={styles.fieldLabel}>End time (HH:MM, 24hr)</Text>
              <TextInput style={styles.textInput} placeholder="16:30" value={reportEnd} onChangeText={setReportEnd} />
              <Pressable style={styles.applyButton} onPress={handleReportOutage}>
                <Text style={styles.applyButtonText}>Submit</Text>
              </Pressable>
              {reportStatus && <Text style={styles.reportStatus}>{reportStatus}</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  loadingBlock: { alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 12, color: '#666' },
  riskBlock: { backgroundColor: '#111', borderRadius: 12, padding: 20, marginBottom: 12 },
  riskTier: { color: '#fff', fontSize: 28, fontWeight: '700' },
  riskScore: { color: '#aaa', marginTop: 4 },
  riskExplanation: { color: '#fff', marginTop: 12, fontSize: 14 },
  staleBanner: { backgroundColor: '#fff3cd', borderRadius: 8, padding: 10, marginBottom: 16 },
  staleBannerText: { color: '#664d03', fontSize: 13 },
  block: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 12 },
  blockLabel: { fontWeight: '600', marginBottom: 6 },
  errorLabel: { fontWeight: '600', color: '#b00020', marginBottom: 6 },
  errorText: { color: '#666' },
  confirmRow: { marginBottom: 14 },
  confirmLabel: { marginBottom: 8 },
  confirmButtons: { flexDirection: 'row' },
  confirmButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, marginRight: 10, borderWidth: 1 },
  yesButton: { backgroundColor: '#111', borderColor: '#111' },
  yesButtonText: { color: '#fff', fontWeight: '600' },
  noButton: { backgroundColor: '#fff', borderColor: '#ccc' },
  noButtonText: { color: '#111', fontWeight: '600' },
  note: { marginTop: 8, fontSize: 12, color: '#888' },
  fieldLabel: { marginTop: 12, marginBottom: 4, fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#ccc', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 13, color: '#111' },
  chipTextActive: { color: '#fff' },
  textInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, fontSize: 14 },
  applyButton: { backgroundColor: '#111', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 14 },
  applyButtonText: { color: '#fff', fontWeight: '600' },
  reportStatus: { marginTop: 10, fontSize: 13, color: '#333' },
})