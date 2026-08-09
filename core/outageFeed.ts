export interface ScheduledOutage {
  district: string;
  circle: string;
  section: string;
  startTime: string;
  endTime: string;
  affectedAreas: string[];
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

export function parseOutageFeed(raw: string): ScheduledOutage[] {
  // this whole parser depends on nammamap's current heading format, breaks if they change it
  const out: ScheduledOutage[] = []

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
  return parseOutageFeed(raw)
}

export function matchesLocality(o: ScheduledOutage, locality: string): boolean {
  const n = locality.trim().toLowerCase()
  if (!n) return false
  return o.affectedAreas.some((a) => a.toLowerCase().includes(n))
}