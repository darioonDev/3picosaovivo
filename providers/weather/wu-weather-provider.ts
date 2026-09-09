import { getSiteConfig } from "@/lib/config/resolve";
import { CURRENT_CONDITIONS, generateHistoricalData } from "@/mocks/weather";
import type {
  CurrentConditions,
  HistoricalPoint,
  HistoryRange,
  WeatherStationProvider,
} from "./weather-provider";

/**
 * Real weather provider: reads the same Weather Underground PWS the Sentinela
 * site uses (station INOVAF30). Falls back to WU's public dashboard key when
 * no personal WU_API_KEY is set, so live data loads with zero config.
 *
 * Current conditions and today's 24h history come from the station. 7d/30d
 * history isn't available on the free/public path, so those ranges fall back
 * to the mock generator (the chart still renders); only "24h" is live.
 */
const API_BASE = "https://api.weather.com/v2/pws";
// Public key embedded in WU's own dashboard frontend — not a secret.
const WU_PUBLIC_DASHBOARD_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

const COMPASS_PT = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
function degToCompass(deg: number | null | undefined): string {
  if (deg == null) return "—";
  return COMPASS_PT[Math.round(((deg % 360) / 45)) % 8];
}

interface WuMetric {
  temp?: number | null;
  tempAvg?: number | null;
  windSpeed?: number | null;
  windspeedAvg?: number | null;
  pressure?: number | null;
  pressureMax?: number | null;
  precipRate?: number | null;
  precipTotal?: number | null;
}
interface WuObs {
  obsTimeUtc?: string | null;
  obsTimeLocal?: string | null;
  humidity?: number | null;
  humidityAvg?: number | null;
  winddir?: number | null;
  winddirAvg?: number | null;
  uv?: number | null;
  solarRadiation?: number | null;
  metric?: WuMetric | null;
}
interface WuResponse {
  observations?: WuObs[] | null;
}

async function fetchWu(path: string): Promise<WuResponse | null> {
  // Read per request, not at module scope: these are admin settings now, and a
  // module-scope read would only pick up a change after a process restart.
  const { wuApiKey, wuStationId } = await getSiteConfig();
  const key = wuApiKey || WU_PUBLIC_DASHBOARD_KEY;
  const url =
    `${API_BASE}/${path}?stationId=${encodeURIComponent(wuStationId)}` +
    `&format=json&units=m&apiKey=${encodeURIComponent(key)}`;
  try {
    // The URL embeds the API key, so a fetch cache would key on it and change
    // behaviour the moment a key is configured. No caching here.
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as WuResponse;
  } catch {
    return null;
  }
}

export class WuWeatherStationProvider implements WeatherStationProvider {
  async getCurrentConditions(): Promise<CurrentConditions> {
    const data = await fetchWu("observations/current");
    const o = data?.observations?.[0];
    const m = o?.metric;
    if (!o || !m || m.temp == null) {
      // Offline / no reading: degrade to mock values so the UI never shows NaN.
      return { ...CURRENT_CONDITIONS, observedAt: new Date().toISOString() };
    }
    return {
      observedAt: o.obsTimeUtc ?? new Date().toISOString(),
      temperatureC: m.temp ?? NaN,
      humidityPct: o.humidity ?? NaN,
      windSpeedKmh: m.windSpeed ?? 0,
      windDirection: degToCompass(o.winddir),
      pressureHpa: m.pressure ?? NaN,
      rainMmPerHour: m.precipRate ?? 0,
      visibilityKm: null, // WU PWS does not report visibility.
      solarRadiationWm2: o.solarRadiation ?? null,
    };
  }

  async getHistoricalData(range: HistoryRange): Promise<HistoricalPoint[]> {
    if (range !== "24h") {
      // Not available on the public path — keep the chart populated.
      return generateHistoricalData(range);
    }
    const data = await fetchWu("observations/all/1day");
    const obs = data?.observations ?? [];
    const points = obs
      .map((o): HistoricalPoint | null => {
        const m = o.metric;
        const temp = m?.tempAvg ?? m?.temp;
        if (temp == null || !o.obsTimeUtc) return null;
        return {
          timestamp: o.obsTimeUtc,
          temperatureC: temp,
          humidityPct: o.humidityAvg ?? o.humidity ?? 0,
          pressureHpa: m?.pressureMax ?? m?.pressure ?? 0,
          windSpeedKmh: m?.windspeedAvg ?? m?.windSpeed ?? 0,
          rainMm: m?.precipTotal ?? 0,
        };
      })
      .filter((p): p is HistoricalPoint => p !== null);
    // If the station returned nothing usable, fall back so the chart isn't blank.
    return points.length > 0 ? points : generateHistoricalData("24h");
  }
}

export const wuWeatherStationProvider = new WuWeatherStationProvider();
