export type StreamingState = "live" | "offline" | "starting";

export interface StreamingStatus {
  state: StreamingState;
  /** "hls" once real video is wired up; "none" while there is nothing to play. */
  protocol: "hls" | "none";
  lastCheckedAt: string;
}

/**
 * Abstraction over the playback side of the video pipeline
 * (camera → gateway → FFmpeg → HLS → CDN → browser). The mock implementation
 * never returns a real stream — see getPlaybackUrl.
 */
export interface StreamingProvider {
  /** Returns an HLS playback URL, or null while there is no real stream to serve. */
  getPlaybackUrl(): Promise<string | null>;
  getStatus(): Promise<StreamingStatus>;
}
