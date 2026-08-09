import { WeatherFactor } from './weather'
import { HistoryFactor } from './historyFactor'
import { InfrastructureFactor } from './infrastructureFactor'
import { RiskTier } from './confirmationLog'

// history counts more than weather, infra just a light nudge
const w1 = 0.35
const w2 = 0.5
const w3 = 0.15

export interface RiskResult {
  score: number;
  tier: RiskTier;
  dominantFactor: 'weather' | 'history' | 'infrastructure' | 'both';
  explanation: string;
}

const t1 = 0.35 // below this = Low
const t2 = 0.65 // above this = High, between the two = Elevated

export function computeRisk(
  a: WeatherFactor,
  b: HistoryFactor,
  c: InfrastructureFactor
): RiskResult {
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

  return { score, tier, dominantFactor: dom, explanation }
}