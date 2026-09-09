import { AlertsBanner } from "@/components/dashboard/alerts-banner";
import { CameraSection } from "@/components/dashboard/camera-section";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { SystemStatusPanel } from "@/components/dashboard/system-status-panel";
import { WeatherHistoryChart } from "@/components/dashboard/weather-history-chart";
import {
  getCameraProvider,
  getForecastProvider,
  getStreamingProvider,
  getWeatherProvider,
} from "@/providers";
import { getAlerts } from "@/lib/store";
import type { HistoricalPoint, HistoryRange } from "@/providers/weather/weather-provider";

// Render per request so the live weather (and camera status) are fresh — the
// WU fetch itself is cached 5 min, so the public key isn't hammered. Without
// this the page prerenders at build time and bakes in stale/mock data.
export const dynamic = "force-dynamic";

const HISTORY_RANGES: HistoryRange[] = ["24h", "7d", "30d"];

export default async function Page() {
  const cameraProvider = getCameraProvider();
  const weatherProvider = getWeatherProvider();
  const forecastProvider = getForecastProvider();
  const streamingProvider = getStreamingProvider();

  const [
    cameraStatus,
    presets,
    currentConditions,
    hourlyForecast,
    dailyForecast,
    historyEntries,
    streamUrl,
  ] = await Promise.all([
    cameraProvider.getStatus(),
    cameraProvider.getPresets(),
    weatherProvider.getCurrentConditions(),
    forecastProvider.getHourlyForecast(),
    forecastProvider.getDailyForecast(),
    Promise.all(
      HISTORY_RANGES.map(async (range) => [
        range,
        await weatherProvider.getHistoricalData(range),
      ] as const)
    ),
    streamingProvider.getPlaybackUrl(),
  ]);

  const alerts = await getAlerts();

  const historicalData = Object.fromEntries(historyEntries) as Record<
    HistoryRange,
    HistoricalPoint[]
  >;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <AlertsBanner alerts={alerts} />

      <CameraSection
        status={cameraStatus}
        initialPresets={presets}
        conditions={currentConditions}
        streamUrl={streamUrl}
      />

      <ForecastCard hours={hourlyForecast} days={dailyForecast} />
      <WeatherHistoryChart data={historicalData} />
      <SystemStatusPanel />
    </div>
  );
}
