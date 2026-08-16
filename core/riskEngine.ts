import { WeatherFactor } from './weather'
import { HistoryFactor } from './historyFactor'
import { InfrastructureFactor } from './infrastructureFactor'
import { RiskTier } from './confirmationLog'
import { RiskTolerance } from './userSettings'

// history counts more than weather, infra just a light nudge
const w1 = 0.35
const w2 = 0.5
const w3 = 0.15

export interface RiskResult {
  score: number;
  tier: RiskTier;
  dominantFactor: 'weather' | 'history' | 'infrastructure' | 'both';
  explanation: string;
  // Raw weighted contributions (weight * factor score) behind `score`,
  // exposed so the UI can show each factor's share of the total risk.
  contributions: {
    weather: number;
    history: number;
    infrastructure: number;
  };
}

// Base thresholds, used for 'balanced'. 'cautious' users see Elevated/High
// sooner (lower thresholds); 'minimal' users only see them at higher scores.
const BASE_T1 = 0.35 // below this = Low
const BASE_T2 = 0.65 // above this = High, between the two = Elevated

const TOLERANCE_OFFSET: Record<RiskTolerance, number> = {
  cautious: -0.1,
  balanced: 0,
  minimal: 0.1,
}

export function computeRisk(
  a: WeatherFactor,
  b: HistoryFactor,
  c: InfrastructureFactor,
  tolerance: RiskTolerance = 'balanced'
): RiskResult {
  const offset = TOLERANCE_OFFSET[tolerance] ?? TOLERANCE_OFFSET.balanced
  const t1 = BASE_T1 + offset
  const t2 = BASE_T2 + offset
  const c1 = a.score * w1
  const c2 = b.score * w2
  const c3 = c.score * w3

  const score = c1 + c2 + c3

  let tier: RiskTier = 'Low'
  if (score >= t2) {
    tier = 'High'
  } else if (score >= t1) {
    tier = 'Elevated'
  }

  const diff = Math.abs(c1 - c2)
  // infra never gets to be "the reason" on its own, its self reported and weaker signal
  let dom: RiskResult['dominantFactor'] = 'both'
  if (diff > 0.12) {
    dom = c1 > c2 ? 'weather' : 'history'
  }

  let explanation: string
  if (tier === 'Low') {
    explanation = "Low risk right now - we'll let you know if that changes."
  } else if (dom === 'weather') {
    explanation = `${tier} risk today, mainly driven by ${a.reason.toLowerCase()}.`
  } else if (dom === 'history') {
    explanation = `${tier} risk today, mainly based on recent outage patterns in your area.`
  } else {
    explanation = `${tier} risk today, driven by both current weather and recent outage patterns.`
  }

  return { score, tier, dominantFactor: dom, explanation, contributions: { weather: c1, history: c2, infrastructure: c3 } }
}