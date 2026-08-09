import { ConfirmedWindow } from './confirmationLog'

export interface HistoryFactor {
  score: number;
  reason: string;
  sampleSize: number;
}

// no local data yet, so lean neutral instead of 0 or 1
const n1 = 0.4
// need at least this many logged windows before trusting the real frequency
const m1 = 5

export function computeHistoryFactor(win: ConfirmedWindow[]): HistoryFactor {
  if (win.length === 0) {
    return {
      score: n1,
      reason: 'Not enough local history yet - using a neutral default',
      sampleSize: 0,
    }
  }

  const outageCount = win.filter((w) => w.outcome === 'outage').length
  const freq = outageCount / win.length

  // blend real frequency with the neutral default until sample size is big enough
  const conf = Math.min(win.length / m1, 1)
  const score = freq * conf + n1 * (1 - conf)

  return {
    score,
    reason: `${outageCount} of ${win.length} recent alert windows resulted in an outage`,
    sampleSize: win.length,
  }
}