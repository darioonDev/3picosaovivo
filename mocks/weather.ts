import type {
  CurrentConditions,
  HistoricalPoint,
  HistoryRange,
} from "@/providers/weather/weather-provider";
import { createRng, randomInRange } from "./random";

export const CURRENT_CONDITIONS: CurrentConditions = {
  observedAt: new Date().toISOString(),
  temperatureC: 18.6,
  humidityPct: 87,
  windSpeedKmh: 14,
  windDirection: "NE",
  pressureHpa: 892,
  rainMmPerHour: 0.0,
  visibilityKm: 12,
  solarRadiationWm2: 420,
};

const RANGE_CONFIG: Record<
  HistoryRange,
  { points: number; stepHours: number; seed: number }
> = {
  "24h": { points: 24, stepHours: 1, seed: 24 },
  "7d": { points: 56, stepHours: 3, seed: 7 },
  "30d": { points: 120, stepHours: 6, seed: 30 },
};

/** Mountain-climate diurnal curve — warmer mid-afternoon, cooler overnight. */
function diurnalTemperature(hourOfDay: number) {
  const base = 13.5;
  const amplitude = 6.5;
  const peakHour = 14;
  return base + amplitude * Math.cos(((hourOfDay - peakHour) / 24) * 2 * Math.PI);
}

export function generateHistoricalData(range: HistoryRange): HistoricalPoint[] {
  const { points, stepHours, seed } = RANGE_CONFIG[range];
  const rng = createRng(seed);
  const now = Date.now();
  const stepMs = stepHours * 60 * 60 * 1000;

  const series: HistoricalPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const hourOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
    const temperatureC =
      diurnalTemperature(hourOfDay) + randomInRange(rng, -0.8, 0.8);
    const humidityPct = Math.min(
      100,
      Math.max(40, 90 - (temperatureC - 10) * 2.2 + randomInRange(rng, -4, 4))
    );
    const pressureHpa = 892 + randomInRange(rng, -3, 3);
    const windSpeedKmh = Math.max(0, 10 + randomInRange(rng, -6, 10));
    const rainMm = rng() > 0.88 ? randomInRange(rng, 0.2, 4) : 0;

    series.push({
      timestamp: timestamp.toISOString(),
      temperatureC: Number(temperatureC.toFixed(1)),
      humidityPct: Number(humidityPct.toFixed(0)),
      pressureHpa: Number(pressureHpa.toFixed(0)),
      windSpeedKmh: Number(windSpeedKmh.toFixed(1)),
      rainMm: Number(rainMm.toFixed(1)),
    });
  }
  return series;
}
