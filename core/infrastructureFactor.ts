export type FeederType = 'industrial' | 'mixed' | 'not_sure';
export type BackupGenerator = 'none' | 'diesel' | 'other';

export interface InfrastructureInput {
  feederType: FeederType;
  buildingAgeYears: number | null;
  priorOutageFrequencyPerMonth: number | null;
  backupGenerator: BackupGenerator;
}

export interface InfrastructureFactor {
  score: number;
  reason: string;
}

const d1: InfrastructureInput = {
  feederType: 'not_sure',
  buildingAgeYears: null,
  priorOutageFrequencyPerMonth: null,
  backupGenerator: 'none',
}

export function computeInfrastructureFactor(inp: InfrastructureInput = d1): InfrastructureFactor {
  const notes: string[] = []
  // starts neutral-low since infra alone shouldnt swing the score much
  let score = 0.3

  if (inp.feederType === 'industrial') {
    score += 0.15
    notes.push('industrial feeder line')
  }

  if (inp.buildingAgeYears !== null) {
    if (inp.buildingAgeYears > 20) {
      score += 0.15
      notes.push('older building/connection age')
    } else if (inp.buildingAgeYears > 10) {
      score += 0.05
    }
  }

  if (inp.priorOutageFrequencyPerMonth !== null) {
    const f = Math.min(inp.priorOutageFrequencyPerMonth / 10, 0.3)
    score += f
    if (inp.priorOutageFrequencyPerMonth >= 3) {
      notes.push('frequent past outages reported')
    }
  }

  // a backup generator doesn't prevent an outage, but it's a real mitigating
  // factor for the business - small downward nudge, diesel being the most
  // common/reliable option gets a slightly bigger one than "other"
  if (inp.backupGenerator === 'diesel') {
    score -= 0.1
    notes.push('has a diesel backup generator')
  } else if (inp.backupGenerator === 'other') {
    score -= 0.05
    notes.push('has backup power')
  }

  score = Math.max(0, Math.min(score, 1))

  const reason =
    notes.length > 0
      ? `Based on your setup: ${notes.join(', ')}`
      : 'Based on your setup - no strong signal either way'

  return { score, reason }
}