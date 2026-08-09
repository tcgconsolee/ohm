import { Platform } from 'react-native'
import { RiskTier } from './confirmationLog'

export interface NotificationHandle {
  id: string;
}

async function n1() {
  const m = await import('expo-notifications')
  return m
}

let f1 = false

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // expo-notifications scheduling just doesnt work on web, per their docs
    console.warn('Notifications are not supported on web via Expo - skipping permission request.')
    return false
  }
  try {
    const n = await n1()
    const { status: s1 } = await n.getPermissionsAsync()
    let s2 = s1
    if (s1 !== 'granted' && !f1) {
      f1 = true
      const { status } = await n.requestPermissionsAsync()
      s2 = status
    }
    return s2 === 'granted'
  } catch (e) {
    console.warn('Notification permission request failed:', e)
    return false
  }
}

export async function sendRiskAlert(tier: RiskTier, explanation: string): Promise<NotificationHandle | null> {
  if (Platform.OS === 'web') {
    console.warn(`[web fallback] Would send risk alert: ${tier} - ${explanation}`)
    return null
  }
  const granted = await ensureNotificationPermission()
  if (!granted) {
    console.warn('Notification permission not granted - risk alert not sent.')
    return null
  }
  try {
    const n = await n1()
    const id = await n.scheduleNotificationAsync({
      content: {
        title: `${tier} risk of a power outage`,
        body: explanation,
        sound: true,
      },
      trigger: null,
    })
    return { id }
  } catch (e) {
    console.warn('Failed to send risk alert notification:', e)
    return null
  }
}

export async function scheduleConfirmationPrompt(
  windowId: string,
  riskLevel: RiskTier,
  fireAt: Date
): Promise<NotificationHandle | null> {
  if (Platform.OS === 'web') {
    console.warn(`[web fallback] Would schedule confirmation prompt for window ${windowId} at ${fireAt.toISOString()}`)
    return null
  }
  const granted = await ensureNotificationPermission()
  if (!granted) {
    console.warn('Notification permission not granted - confirmation prompt not scheduled.')
    return null
  }
  const secs = Math.max(1, Math.round((fireAt.getTime() - Date.now()) / 1000))
  try {
    const n = await n1()
    const id = await n.scheduleNotificationAsync({
      content: {
        title: 'Did the power go out?',
        body: `We flagged ${riskLevel.toLowerCase()} risk earlier - let us know what happened.`,
        sound: true,
        data: { windowId, type: 'confirmation_prompt' },
      },
      trigger: {
        type: 'timeInterval' as any,
        seconds: secs,
        repeats: false,
      } as any,
    })
    return { id }
  } catch (e) {
    console.warn('Failed to schedule confirmation prompt:', e)
    return null
  }
}