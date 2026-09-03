import { CURRENT_CONDITIONS, generateHistoricalData } from "@/mocks/weather";
import type {
  CurrentConditions,
  HistoricalPoint,
  HistoryRange,
  WeatherStationProvider,
} from "./weather-provider";

export class MockWeatherStationProvider implements WeatherStationProvider {
  async getCurrentConditions(): Promise<CurrentConditions> {
    return { ...CURRENT_CONDITIONS, observedAt: new Date().toISOString() };
  }

  async getHistoricalData(range: HistoryRange): Promise<HistoricalPoint[]> {
    return generateHistoricalData(range);
  }
}

export const mockWeatherStationProvider = new MockWeatherStationProvider();
