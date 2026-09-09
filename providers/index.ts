import { storeCameraProvider } from "./camera/store-camera-provider";
import { mockForecastProvider } from "./forecast/mock-forecast-provider";
import { hlsStreamingProvider } from "./streaming/hls-streaming-provider";
import { wuWeatherStationProvider } from "./weather/wu-weather-provider";
import type { CameraProvider } from "./camera/camera-provider";
import type { ForecastProvider } from "./forecast/forecast-provider";
import type { StreamingProvider } from "./streaming/streaming-provider";
import type { WeatherStationProvider } from "./weather/weather-provider";

/**
 * Single switchboard for provider implementations. Weather, streaming and the
 * camera are backed by real sources (Weather Underground, the RTSP→HLS
 * gateway, the admin store); the forecast is still a mock. Swapping one means
 * adding an implementation of the matching interface and changing the return
 * here — nothing that calls these functions needs to change.
 *
 * These are server-only: they read the store and server-side env. Never import
 * this module from a client component — call a Server Action instead (see
 * app/actions/camera.ts).
 */
export function getCameraProvider(): CameraProvider {
  return storeCameraProvider;
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
