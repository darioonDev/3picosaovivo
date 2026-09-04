import type { HistoricalPoint, HistoryRange } from "@/providers/weather/weather-provider";

export type MetricKey = Exclude<keyof HistoricalPoint, "timestamp">;

export interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  decimals: number;
}

/** The five historical metrics, shared by the dashboard summary and the /historico page. */
export const METRICS: MetricDef[] = [
  { key: "temperatureC", label: "Temperatura", unit: "°C", color: "var(--chart-1)", decimals: 1 },
  { key: "humidityPct", label: "Umidade", unit: "%", color: "var(--chart-2)", decimals: 0 },
  { key: "pressureHpa", label: "Pressão", unit: "hPa", color: "var(--chart-3)", decimals: 0 },
  { key: "windSpeedKmh", label: "Vento", unit: "km/h", color: "var(--chart-4)", decimals: 1 },
  { key: "rainMm", label: "Chuva", unit: "mm", color: "var(--chart-5)", decimals: 1 },
];

export const RANGES: HistoryRange[] = ["24h", "7d", "30d"];

export const RANGE_LABELS: Record<HistoryRange, string> = {
  "24h": "24 horas",
  "7d": "7 dias",
  "30d": "30 dias",
};

/** X-axis / table tick: hour for 24h, day/month otherwise. */
export function formatTick(range: HistoryRange, value: string): string {
  const date = new Date(value);
  if (range === "24h") {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Full timestamp for the data table. */
export function formatStamp(range: HistoryRange, value: string): string {
  const date = new Date(value);
  if (range === "24h") {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface MetricStats {
  min: number;
  max: number;
  avg: number;
}

/** Min / max / average of a metric across a series (null when empty). */
export function computeStats(points: HistoricalPoint[], key: MetricKey): MetricStats | null {
  if (points.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const point of points) {
    const value = point[key];
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
  }
  return { min, max, avg: sum / points.length };
}
