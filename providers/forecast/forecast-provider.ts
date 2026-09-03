export type SkyCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "storm"
  | "fog";

export interface HourlyForecastPoint {
  timestamp: string;
  temperatureC: number;
  rainChancePct: number;
  windSpeedKmh: number;
  cloudCoverPct: number;
  condition: SkyCondition;
}

export interface DailyForecastPoint {
  date: string;
  label: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  rainChancePct: number;
  windSpeedKmh: number;
  cloudCoverPct: number;
  condition: SkyCondition;
}

/**
 * Abstraction over a forecast source. The mock implementation returns
 * generated data; swapping in a real forecast API later only means writing
 * a new implementation of this interface.
 */
export interface ForecastProvider {
  getHourlyForecast(): Promise<HourlyForecastPoint[]>;
  getDailyForecast(): Promise<DailyForecastPoint[]>;
}
