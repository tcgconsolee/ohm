export interface ScheduledOutage {
  district: string;
  circle: string;
  section: string;
  date: string; // ISO date (YYYY-MM-DD) this outage applies to - the feed's startTime/endTime are time-of-day only
  startTime: string; // "HH:MM", time-of-day only, no date component
  endTime: string; // "HH:MM", time-of-day only, no date component
  affectedAreas: string[];
}

// Combines a ScheduledOutage's date with its HH:MM start/end times into
// real, comparable Date objects. new Date("16:00") alone is Invalid Date -
// this is why that field can't be parsed directly.
export function getOutageDateRange(o: ScheduledOutage): { start: Date; end: Date } | null {
  const start = new Date(`${o.date}T${o.startTime}:00`)
  const end = new Date(`${o.date}T${o.endTime}:00`)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  return { start, end }
}

const u1 = 'https://outage.nammamap.in/outages-feed'

function f1(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

export async function fetchOutageFeedRaw(district: string, date: Date = new Date()): Promise<string> {
  const p = new URLSearchParams({
    date: f1(date),
    district,
  })
  const r = await fetch(`${u1}?${p.toString()}`)
  if (!r.ok) {
    throw new Error(`Outage feed request failed: ${r.status}`)
  }
  return r.text()
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function parseOutageFeed(raw: string, forDate: Date = new Date()): ScheduledOutage[] {
  // this whole parser depends on nammamap's current heading format, breaks if they change it
  const out: ScheduledOutage[] = []
  const isoDate = toIsoDate(forDate)

  const lines = raw.split('\n').map((l) => l.trim())

  let district = ''
  let circle = ''
  let section = ''
  let time: { start: string; end: string } | null = null
  let collecting = false
  let areas: string[] = []

  const flush = () => {
    if (section && time) {
      out.push({
        district,
        circle,
        section,
        date: isoDate,
        startTime: time.start,
        endTime: time.end,
        affectedAreas: [...areas],
      })
    }
    areas = []
  }

  for (const line of lines) {
    const m1 = line.match(/^###\s*📍\s*(.+?)\s*District$/i)
    if (m1) {
      flush()
      district = m1[1].trim()
      section = ''
      time = null
      continue
    }

    const m2 = line.match(/^####\s*🏢\s*(.+?)\s*Circle$/i)
    if (m2) {
      flush()
      circle = m2[1].trim()
      section = ''
      time = null
      continue
    }

    const m3 = line.match(/^#####\s*(?:⚡|🛠️)\s*(?:Section:|Division:)?\s*(.+?)(?:\s*\(Approximated\))?$/i)
    if (m3) {
      flush()
      section = m3[1].trim()
      time = null
      collecting = false
      continue
    }

    const m4 = line.match(/^\*\*Time:\*\*\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
    if (m4) {
      time = { start: m4[1], end: m4[2] }
      continue
    }

    if (/^\*\*Affected Areas:\*\*/.test(line)) {
      collecting = true
      continue
    }

    if (collecting) {
      const m5 = line.match(/^-\s*(.+)$/)
      if (m5) {
        areas.push(m5[1].trim())
      } else if (line.startsWith('#')) {
        // only a new heading ends the list, blank lines between bullets are normal
        collecting = false
      }
    }
  }
  flush()

  return out
}

export async function fetchScheduledOutages(district: string, date: Date = new Date()): Promise<ScheduledOutage[]> {
  const raw = await fetchOutageFeedRaw(district, date)
  return parseOutageFeed(raw, date)
}

const CACHE_KEY_PREFIX = 'ohm:outageFeedCache:'

interface CachedOutages {
  outages: ScheduledOutage[];
  fetchedAt: string;
}

async function getAsyncStorage() {
  const m = await import('@react-native-async-storage/async-storage')
  return m.default
}

function cacheKey(district: string, date: Date): string {
  return `${CACHE_KEY_PREFIX}${district}:${f1(date)}`
}

async function readCache(district: string, date: Date): Promise<CachedOutages | null> {
  try {
    const AsyncStorage = await getAsyncStorage()
    const raw = await AsyncStorage.getItem(cacheKey(district, date))
    if (!raw) return null
    return JSON.parse(raw) as CachedOutages
  } catch {
    return null
  }
}

async function writeCache(district: string, date: Date, outages: ScheduledOutage[]): Promise<void> {
  try {
    const AsyncStorage = await getAsyncStorage()
    const cached: CachedOutages = { outages, fetchedAt: new Date().toISOString() }
    await AsyncStorage.setItem(cacheKey(district, date), JSON.stringify(cached))
  } catch (err) {
    console.warn('Outage feed: failed to write cache', err)
  }
}

// Each day's prefetch writes a new per-day cache key and nothing ever
// removed old ones - after months of daily use this accumulates hundreds of
// stale keys for dates that have long since passed. Removes cache entries
// older than a small retention window (keeps yesterday too, as a small
// safety margin for a pipeline run right after midnight).
async function pruneStaleCache(): Promise<void> {
  try {
    const AsyncStorage = await getAsyncStorage()
    const allKeys = await AsyncStorage.getAllKeys()
    const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_KEY_PREFIX))

    const retentionCutoff = new Date()
    retentionCutoff.setDate(retentionCutoff.getDate() - 1)
    retentionCutoff.setHours(0, 0, 0, 0)

    const staleKeys = cacheKeys.filter((k) => {
      // key format: "ohm:outageFeedCache:<district>:<dd-mm-yyyy>"
      const datePart = k.slice(k.lastIndexOf(':') + 1)
      const m = datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/)
      if (!m) return false // unrecognized format, leave it alone rather than guess
      const keyDate = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
      return keyDate.getTime() < retentionCutoff.getTime()
    })

    if (staleKeys.length > 0) {
      await AsyncStorage.multiRemove(staleKeys)
    }
  } catch (err) {
    // Best-effort cleanup - a failure here doesn't affect correctness, just
    // means storage doesn't get trimmed this round.
    console.warn('Outage feed: failed to prune stale cache', err)
  }
}

export interface OutageFeedResult {
  outages: ScheduledOutage[];
  isStale: boolean; // true when served from cache because the live fetch failed
  fetchedAt: string | null; // when the data (live or cached) was actually fetched; null if there's no data at all
}

// Fetches today's outage feed, caching on success and falling back to the
// last successfully cached data for today if the live fetch fails. The
// feed site going down previously meant scheduledOutages silently became
// [] with no fallback at all, so a real scheduled outage the site had
// already reported could be dropped entirely if the site happened to be
// unreachable right when the pipeline ran.
export async function fetchScheduledOutagesWithFallback(
  district: string,
  date: Date = new Date()
): Promise<OutageFeedResult> {
  try {
    const outages = await fetchScheduledOutages(district, date)
    await writeCache(district, date, outages)
    return { outages, isStale: false, fetchedAt: new Date().toISOString() }
  } catch (err) {
    console.warn('Outage feed unavailable, checking cache:', err)
    const cached = await readCache(district, date)
    if (cached) {
      return { outages: cached.outages, isStale: true, fetchedAt: cached.fetchedAt }
    }
    // No live data and nothing cached for this day either - genuinely
    // nothing available, but this is now an explicit, visible state rather
    // than a silently swallowed error.
    return { outages: [], isStale: true, fetchedAt: null }
  }
}

// Proactively fetches and caches today plus the next 2 days (3 days total)
// whenever the network is reachable, so that if the feed site goes down
// later, the app still has locally-cached data to fall back to for
// whichever of those days it's currently showing - rather than only ever
// caching "today" and having nothing for tomorrow if the outage happens
// right when the site is down. Best-effort: failures for individual days
// are swallowed since this is a background warm-up, not the primary fetch
// path (fetchScheduledOutagesWithFallback handles that with its own
// fallback and error surfacing).
export async function prefetchScheduledOutages(district: string, daysAhead: number = 3): Promise<void> {
  await pruneStaleCache()

  const today = new Date()
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    try {
      const outages = await fetchScheduledOutages(district, date)
      await writeCache(district, date, outages)
    } catch (err) {
      // Best-effort - a failure here just means that day's cache doesn't
      // get refreshed this round; fetchScheduledOutagesWithFallback will
      // still fall back to whatever was cached from a previous successful
      // prefetch.
      console.warn(`Outage feed: prefetch failed for ${f1(date)}`, err)
    }
  }
}

export function matchesLocality(o: ScheduledOutage, locality: string, pincode?: string): boolean {
  const n = locality.trim().toLowerCase()
  const p = pincode?.trim().toLowerCase() ?? ''
  if (!n && !p) return false
  return o.affectedAreas.some((a) => {
    const areaLower = a.toLowerCase()
    return (n && areaLower.includes(n)) || (p && areaLower.includes(p))
  })
}