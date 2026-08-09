export interface WeatherSnapshot {
  time: string[];
  precipitationProbability: number[];
  windSpeed: number[];
  windGusts: number[];
  weatherCode: number[];
}

export interface WeatherFactor {
  score: number;
  reason: string;
}

const u1 = 'https://api.open-meteo.com/v1/forecast'

export async function fetchWeather(a: number, b: number): Promise<WeatherSnapshot> {
  const p = new URLSearchParams({
    latitude: String(a),
    longitude: String(b),
    hourly: 'precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code',
    forecast_hours: '12',
    timezone: 'Asia/Kolkata',
  })

  const r = await fetch(`${u1}?${p.toString()}`)
  if (!r.ok) {
    throw new Error(`Open-Meteo request failed: ${r.status}`)
  }
  const d = await r.json()

  return {
    time: d.hourly.time,
    precipitationProbability: d.hourly.precipitation_probability,
    windSpeed: d.hourly.wind_speed_10m,
    windGusts: d.hourly.wind_gusts_10m,
    weatherCode: d.hourly.weather_code,
  }
}

const k1 = 'ohm:weatherCache:'

interface CachedWeather {
  snapshot: WeatherSnapshot;
  fetchedAt: string;
}

async function s1() {
  const m = await import('@react-native-async-storage/async-storage')
  return m.default
}

function k2(a: number, b: number): string {
  return `${k1}${a.toFixed(2)},${b.toFixed(2)}`
}

export interface WeatherResult {
  snapshot: WeatherSnapshot;
  isStale: boolean;
  fetchedAt: string;
}

export async function fetchWeatherWithFallback(a: number, b: number): Promise<WeatherResult> {
  const k = k2(a, b)

  let liveSnapshot: WeatherSnapshot | null = null
  let liveErr: unknown = null
  try {
    liveSnapshot = await fetchWeather(a, b)
  } catch (e) {
    liveErr = e
  }

  if (liveSnapshot) {
    const t = new Date().toISOString()
    try {
      const s = await s1()
      await s.setItem(k, JSON.stringify({ snapshot: liveSnapshot, fetchedAt: t } satisfies CachedWeather))
    } catch (e) {
      // cache write failing shouldnt kill the request, live data is still good
      console.warn('Weather cache write failed:', e)
    }
    return { snapshot: liveSnapshot, isStale: false, fetchedAt: t }
  }

  console.warn('Live weather fetch failed, checking cache:', liveErr)

  let raw: string | null = null
  try {
    const s = await s1()
    raw = await s.getItem(k)
  } catch (e) {
    throw new Error(
      `Weather unavailable: live fetch failed and no usable cached data exists. (${
        e instanceof Error ? e.message : String(e)
      })`
    )
  }

  if (!raw) {
    throw new Error(
      `Weather is unavailable and no cached data exists for this location. Original error: ${
        liveErr instanceof Error ? liveErr.message : String(liveErr)
      }`
    )
  }

  const cached = JSON.parse(raw) as CachedWeather
  return { snapshot: cached.snapshot, isStale: true, fetchedAt: cached.fetchedAt }
}

const c1 = new Set([95, 96, 99])

export function computeWeatherFactor(snap: WeatherSnapshot): WeatherFactor {
  const gustMax = Math.max(...snap.windGusts)
  const precipMax = Math.max(...snap.precipitationProbability)
  const stormy = snap.weatherCode.some((x) => c1.has(x))

  const gustScore = Math.min(gustMax / 70, 1)
  const precipScore = precipMax / 100
  const stormScore = stormy ? 1 : 0

  // storm gets the biggest say, gusts and rain just nudge it
  const score = Math.min(stormScore * 0.6 + gustScore * 0.25 + precipScore * 0.15, 1)

  let reason = 'Calm conditions expected'
  if (stormy) {
    reason = 'Thunderstorms forecast in the next 12 hours'
  } else if (gustMax > 40) {
    reason = `Strong wind gusts forecast (up to ${Math.round(gustMax)} km/h)`
  } else if (precipMax > 60) {
    reason = `High chance of rain (${Math.round(precipMax)}%)`
  }

  return { score, reason }
}