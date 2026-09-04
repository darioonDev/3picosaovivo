import { HistoryView } from "@/components/history/history-view";
import { getWeatherProvider } from "@/providers";
import { RANGES } from "@/lib/weather-metrics";
import type { HistoricalPoint, HistoryRange } from "@/providers/weather/weather-provider";

export default async function HistoricoPage() {
  const weatherProvider = getWeatherProvider();

  const entries = await Promise.all(
    RANGES.map(async (range) => [range, await weatherProvider.getHistoricalData(range)] as const)
  );
  const data = Object.fromEntries(entries) as Record<HistoryRange, HistoricalPoint[]>;

  return <HistoryView data={data} />;
}
