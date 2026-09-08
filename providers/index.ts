import { mockCameraProvider } from "./camera/mock-camera-provider";
import { mockForecastProvider } from "./forecast/mock-forecast-provider";
import { hlsStreamingProvider } from "./streaming/hls-streaming-provider";
import { wuWeatherStationProvider } from "./weather/wu-weather-provider";
import type { CameraProvider } from "./camera/camera-provider";
import type { ForecastProvider } from "./forecast/forecast-provider";
import type { StreamingProvider } from "./streaming/streaming-provider";
import type { WeatherStationProvider } from "./weather/weather-provider";

/**
 * Single switchboard for provider implementations. Every one of these
 * returns a mock today; wiring up real hardware later means adding a new
 * implementation of the matching interface and changing the return here —
 * nothing that calls these functions needs to change.
 */
export function getCameraProvider(): CameraProvider {
  return mockCameraProvider;
}

export function getWeatherProvider(): WeatherStationProvider {
  return wuWeatherStationProvider;
}

export function getForecastProvider(): ForecastProvider {
  return mockForecastProvider;
}

export function getStreamingProvider(): StreamingProvider {
  return hlsStreamingProvider;
}

export type {
  CameraProvider,
  ForecastProvider,
  StreamingProvider,
  WeatherStationProvider,
};
