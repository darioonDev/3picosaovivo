import { generateDailyForecast, generateHourlyForecast } from "@/mocks/forecast";
import type {
  DailyForecastPoint,
  ForecastProvider,
  HourlyForecastPoint,
} from "./forecast-provider";

export class MockForecastProvider implements ForecastProvider {
  async getHourlyForecast(): Promise<HourlyForecastPoint[]> {
    return generateHourlyForecast();
  }

  async getDailyForecast(): Promise<DailyForecastPoint[]> {
    return generateDailyForecast();
  }
}

export const mockForecastProvider = new MockForecastProvider();
