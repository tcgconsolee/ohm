export type RiskTier = 'Low' | 'Elevated' | 'High';
export type Outcome = 'outage' | 'no_outage' | null;

export interface ConfirmedWindow {
  id: string;
  riskLevel: RiskTier;
  riskScore?: number; // ADDED: Stores actual continuous risk score (e.g. 0 to 100)
  windowStart: string;
  windowEnd: string;
  outcome: Outcome;
  source: 'post_window_prompt' | 'manual_report' | 'unconfirmed';
}

export interface Persistence {
  load(): Promise<ConfirmedWindow[]>;
  save(windows: ConfirmedWindow[]): Promise<void>;
}

export class InMemoryPersistence implements Persistence {
  private d: ConfirmedWindow[] = [];
  async load() { return this.d; }
  async save(w: ConfirmedWindow[]) { this.d = w; }
}

const k1 = 'ohm:confirmationLog';

async function s1() {
  try {
    const m = await import('@react-native-async-storage/async-storage');
    const a = m.default ?? m;
    if (!a || typeof (a as any).getItem !== 'function') {
      throw new Error('AsyncStorage module loaded but has an unexpected shape');
    }
    return a as typeof import('@react-native-async-storage/async-storage').default;
  } catch (e) {
    throw new Error(`AsyncStorage is unavailable: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export class AsyncStoragePersistence implements Persistence {
  async load(): Promise<ConfirmedWindow[]> {
    const s = await s1();
    const raw = await s.getItem(k1);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ConfirmedWindow[];
    } catch {
      console.warn('ConfirmationLog: stored data was unreadable, starting fresh');
      return [];
    }
  }
  async save(w: ConfirmedWindow[]): Promise<void> {
    const s = await s1();
    await s.setItem(k1, JSON.stringify(w));
  }
}

export class ConfirmationLog {
  constructor(private p: Persistence) {}

  async getAll(): Promise<ConfirmedWindow[]> {
    return this.p.load();
  }

  // UPDATED: Accept an optional numeric risk score parameter
  async addPrediction(level: RiskTier, start: Date, end: Date, score?: number): Promise<string> {
    const w = await this.p.load();
    const id = `${start.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    
    w.push({
      id,
      riskLevel: level,
      riskScore: score ?? (level === 'High' ? 85 : level === 'Elevated' ? 55 : 15), // Safe native fallback
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      outcome: null,
      source: 'unconfirmed',
    });
    await this.p.save(w);
    return id;
  }

  async confirmOutcome(id: string, outcome: 'outage' | 'no_outage', source: 'post_window_prompt' | 'manual_report'): Promise<void> {
    const w = await this.p.load();
    const t = w.find((x) => x.id === id);
    if (t) {
      t.outcome = outcome;
      t.source = source;
      await this.p.save(w);
    }
  }

  async getUnconfirmedWithin(hoursAgo: number): Promise<ConfirmedWindow[]> {
    const w = await this.p.load();
    const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
    return w.filter((x) => x.outcome === null && new Date(x.windowEnd).getTime() >= cutoff);
  }

  async getConfirmed(): Promise<ConfirmedWindow[]> {
    const w = await this.p.load();
    return w.filter((x) => x.outcome !== null);
  }

  async reportOutage(start: Date, end: Date): Promise<{ matchedExistingWindow: boolean; windowId: string }> {
    const w = await this.p.load();

    const overlap = w.find((x) => {
      const s = new Date(x.windowStart).getTime();
      const e = new Date(x.windowEnd).getTime();
      return start.getTime() < e && end.getTime() > s;
    });

    if (overlap) {
      overlap.outcome = 'outage';
      overlap.source = 'manual_report';
      await this.p.save(w);
      return { matchedExistingWindow: true, windowId: overlap.id };
    }

    const id = `manual-${start.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    w.push({
      id,
      riskLevel: 'Low',
      riskScore: 10, // Manual outage reported under unpredicted low risk bounds
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      outcome: 'outage',
      source: 'manual_report',
    });
    await this.p.save(w);
    return { matchedExistingWindow: false, windowId: id };
  }
}
