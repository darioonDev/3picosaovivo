import type {
  DailyForecastPoint,
  HourlyForecastPoint,
  SkyCondition,
} from "@/providers/forecast/forecast-provider";
import { createRng, randomInRange } from "./random";

const HOURLY_CONDITIONS: SkyCondition[] = [
  "clear",
  "partly-cloudy",
  "partly-cloudy",
  "cloudy",
  "fog",
];

const DAILY_CONDITIONS: SkyCondition[] = [
  "clear",
  "partly-cloudy",
  "cloudy",
  "rain",
  "storm",
];

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function pick<T>(rng: () => number, options: T[]): T {
  return options[Math.floor(rng() * options.length) % options.length];
}

export function generateHourlyForecast(hours = 12): HourlyForecastPoint[] {
  const rng = createRng(1201);
  const now = new Date();
  const points: HourlyForecastPoint[] = [];

  for (let i = 1; i <= hours; i++) {
    const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hourOfDay = timestamp.getHours();
    const temperatureC =
      13.5 + 6 * Math.cos(((hourOfDay - 14) / 24) * 2 * Math.PI) +
      randomInRange(rng, -0.6, 0.6);

    points.push({
      timestamp: timestamp.toISOString(),
      temperatureC: Number(temperatureC.toFixed(1)),
      rainChancePct: Math.round(randomInRange(rng, 5, 45)),
      windSpeedKmh: Number(randomInRange(rng, 6, 22).toFixed(1)),
      cloudCoverPct: Math.round(randomInRange(rng, 10, 90)),
      condition: pick(rng, HOURLY_CONDITIONS),
    });
  }
  return points;
}

export function generateDailyForecast(days = 5): DailyForecastPoint[] {
  const rng = createRng(3005);
  const now = new Date();
  const points: DailyForecastPoint[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const label =
      i === 0 ? "Hoje" : i === 1 ? "Amanhã" : WEEKDAY_LABELS[date.getDay()];
    const baseMin = 8 + randomInRange(rng, -1.5, 1.5);
    const baseMax = 20 + randomInRange(rng, -2, 2);

    points.push({
      date: date.toISOString().slice(0, 10),
      label,
      temperatureMinC: Number(baseMin.toFixed(1)),
      temperatureMaxC: Number(baseMax.toFixed(1)),
      rainChancePct: Math.round(randomInRange(rng, 5, 60)),
      windSpeedKmh: Number(randomInRange(rng, 8, 24).toFixed(1)),
      cloudCoverPct: Math.round(randomInRange(rng, 15, 85)),
      condition: pick(rng, DAILY_CONDITIONS),
    });
  }
  return points;
}
