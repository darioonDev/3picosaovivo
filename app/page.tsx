import { CameraSection } from "@/components/dashboard/camera-section";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { SystemStatusPanel } from "@/components/dashboard/system-status-panel";
import { WeatherHistoryChart } from "@/components/dashboard/weather-history-chart";
import {
  getCameraProvider,
  getForecastProvider,
  getWeatherProvider,
} from "@/providers";
import type { HistoricalPoint, HistoryRange } from "@/providers/weather/weather-provider";

const HISTORY_RANGES: HistoryRange[] = ["24h", "7d", "30d"];

export default async function Page() {
  const cameraProvider = getCameraProvider();
  const weatherProvider = getWeatherProvider();
  const forecastProvider = getForecastProvider();

  const [cameraStatus, presets, currentConditions, hourlyForecast, dailyForecast, historyEntries] =
    await Promise.all([
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
    ]);

  const historicalData = Object.fromEntries(historyEntries) as Record<
    HistoryRange,
    HistoricalPoint[]
  >;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <CameraSection
        status={cameraStatus}
        initialPresets={presets}
        conditions={currentConditions}
      />

      <ForecastCard hours={hourlyForecast} days={dailyForecast} />
      <WeatherHistoryChart data={historicalData} />
      <SystemStatusPanel />
    </div>
  );
}
