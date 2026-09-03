export type CameraPresetId = string;

export type CameraPresetStatus = "idle" | "active" | "moving";

export interface CameraPresetPosition {
  /** Simulated pan angle in degrees (-180 to 180). */
  pan: number;
  /** Simulated tilt angle in degrees (-90 to 90). */
  tilt: number;
  /** Simulated zoom level (1x to 30x, per the planned 30x optical zoom). */
  zoom: number;
}

export interface CameraPreset {
  id: CameraPresetId;
  name: string;
  description: string;
  position: CameraPresetPosition;
  status: CameraPresetStatus;
}

export type CameraConnectionStatus = "online" | "offline" | "degraded";

export interface CameraStatus {
  connected: boolean;
  cameraName: string;
  /** Human-readable resolution label — simulated until real hardware is wired up. */
  resolution: string;
  connectionStatus: CameraConnectionStatus;
  lastUpdatedAt: string;
}

/**
 * Abstraction over a PTZ camera. The mock implementation simulates presets
 * and movement; a future implementation would talk to the real camera over
 * ONVIF/RTSP through a gateway — never directly from the browser.
 */
export interface CameraProvider {
  getStatus(): Promise<CameraStatus>;
  getPresets(): Promise<CameraPreset[]>;
  gotoPreset(id: CameraPresetId): Promise<CameraPreset>;
  /**
   * Returns a playable URL for the current view (e.g. an HLS manifest), or
   * null when no stream is available. Never an RTSP URL — that must stay
   * server-side.
   */
  getStreamUrl(): Promise<string | null>;
}
