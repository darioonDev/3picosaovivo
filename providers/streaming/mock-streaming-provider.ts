import type { StreamingProvider, StreamingStatus } from "./streaming-provider";

/**
 * The dashboard presents itself as "live" per the product spec even though
 * there's no real video pipeline yet — protocol stays "none" and
 * getPlaybackUrl stays null until a real HLS pipeline exists.
 */
export class MockStreamingProvider implements StreamingProvider {
  async getPlaybackUrl(): Promise<string | null> {
    return null;
  }

  async getStatus(): Promise<StreamingStatus> {
    return {
      state: "live",
      protocol: "none",
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

export const mockStreamingProvider = new MockStreamingProvider();
