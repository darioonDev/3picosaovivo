export type HistoryRange = "24h" | "7d" | "30d";

/** A single observed reading. Always the station's own measurement — never a forecast. */
export interface CurrentConditions {
  observedAt: string;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  windDirection: string;
  pressureHpa: number;
  rainMmPerHour: number;
  visibilityKm: number;
  solarRadiationWm2: number | null;
}

export interface HistoricalPoint {
  timestamp: string;
  temperatureC: number;
  humidityPct: number;
  pressureHpa: number;
  windSpeedKmh: number;
  rainMm: number;
}

/**
 * Abstraction over a weather station. Independent of the underlying
 * hardware vendor — the mock implementation generates plausible mountain
 * climate data; a future implementation would poll the real station's API.
 */
export interface WeatherStationProvider {
  getCurrentConditions(): Promise<CurrentConditions>;
  getHistoricalData(range: HistoryRange): Promise<HistoricalPoint[]>;
}
