import { CAMERA_PRESETS, CAMERA_STATUS } from "@/mocks/camera";
import type {
  CameraPreset,
  CameraPresetId,
  CameraProvider,
  CameraStatus,
} from "./camera-provider";

const MOVE_DELAY_MS = 900;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates a PTZ camera: presets and "movement" live in a module-level
 * array so gotoPreset has something to mutate, mirroring how a real
 * ONVIF-backed provider would track the head's current position.
 */
export class MockCameraProvider implements CameraProvider {
  private presets: CameraPreset[] = CAMERA_PRESETS.map((preset) => ({
    ...preset,
  }));

  async getStatus(): Promise<CameraStatus> {
    return { ...CAMERA_STATUS, lastUpdatedAt: new Date().toISOString() };
  }

  async getPresets(): Promise<CameraPreset[]> {
    return this.presets.map((preset) => ({ ...preset }));
  }

  async gotoPreset(id: CameraPresetId): Promise<CameraPreset> {
    const target = this.presets.find((preset) => preset.id === id);
    if (!target) {
      throw new Error(`Unknown camera preset: ${id}`);
    }
    await wait(MOVE_DELAY_MS);
    this.presets = this.presets.map((preset) => ({
      ...preset,
      status: preset.id === id ? "active" : "idle",
    }));
    return { ...target, status: "active" };
  }

  async getStreamUrl(): Promise<string | null> {
    return null;
  }
}

export const mockCameraProvider = new MockCameraProvider();
