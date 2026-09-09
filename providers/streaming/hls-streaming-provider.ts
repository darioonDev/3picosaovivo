import { getSiteConfig } from "@/lib/config/resolve";
import type { StreamingProvider, StreamingStatus } from "./streaming-provider";

/**
 * Real streaming provider: serves the project's live HLS feed through the
 * same-origin /live proxy (see app/live/[...path]/route.ts), which pulls from
 * the RTSP→HLS gateway on the VPS. Same feed the Sentinela site plays.
 *
 * getPlaybackUrl returns the relative manifest path (played by hls.js).
 * getStatus probes the manifest server-side to report live/offline.
 */
export class HlsStreamingProvider implements StreamingProvider {
  async getPlaybackUrl(): Promise<string | null> {
    return (await getSiteConfig()).hlsUrl || null;
  }

  async getStatus(): Promise<StreamingStatus> {
    const lastCheckedAt = new Date().toISOString();
    // Read per request so an admin change applies without a restart.
    const { hlsUpstream } = await getSiteConfig();
    if (!hlsUpstream) {
      return { state: "offline", protocol: "none", lastCheckedAt };
    }
    try {
      const res = await fetch(`${hlsUpstream.replace(/\/$/, "")}/stream.m3u8`, {
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
