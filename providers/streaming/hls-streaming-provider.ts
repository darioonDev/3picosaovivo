import type { StreamingProvider, StreamingStatus } from "./streaming-provider";

/**
 * Real streaming provider: serves the project's live HLS feed through the
 * same-origin /live proxy (see app/live/[...path]/route.ts), which pulls from
 * the RTSP→HLS gateway on the VPS. Same feed the Sentinela site plays.
 *
 * getPlaybackUrl returns the relative manifest path (played by hls.js).
 * getStatus probes the manifest server-side to report live/offline.
 */
const MANIFEST_PATH = "/live/stream.m3u8";
const UPSTREAM = process.env.HLS_UPSTREAM || "http://177.7.39.222:8888";

export class HlsStreamingProvider implements StreamingProvider {
  async getPlaybackUrl(): Promise<string | null> {
    return MANIFEST_PATH;
  }

  async getStatus(): Promise<StreamingStatus> {
    const lastCheckedAt = new Date().toISOString();
    try {
      const res = await fetch(`${UPSTREAM.replace(/\/$/, "")}/stream.m3u8`, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      const live = res.ok;
      return {
        state: live ? "live" : "offline",
        protocol: live ? "hls" : "none",
        lastCheckedAt,
      };
    } catch {
      return { state: "offline", protocol: "none", lastCheckedAt };
    }
  }
}

export const hlsStreamingProvider = new HlsStreamingProvider();
