import "server-only";

import { getPresets, setPresetActive } from "@/lib/store";
import { getSiteConfig } from "@/lib/config/resolve";
import { CAMERA_STATUS } from "@/mocks/camera";
import type {
  CameraPreset,
  CameraPresetId,
  CameraProvider,
  CameraStatus,
} from "./camera-provider";

/**
 * Camera provider backed by the admin store.
 *
 * The mock provider held its presets in memory, which meant preset edits made
 * in /admin were never visible on the dashboard and a preset "move" only ever
 * changed the tab that clicked it. Reading and writing the store makes both
 * real, and makes /picos reflect admin edits for free.
 *
 * Status is still partly mock — there is no PTZ hardware yet — but the name
 * and resolution now come from the panel.
 */
export class StoreCameraProvider implements CameraProvider {
  async getStatus(): Promise<CameraStatus> {
    const { cameraName, cameraResolution } = await getSiteConfig();
    return {
      ...CAMERA_STATUS,
      cameraName,
      resolution: cameraResolution,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getPresets(): Promise<CameraPreset[]> {
    return getPresets();
  }

  async gotoPreset(id: CameraPresetId): Promise<CameraPreset> {
    const updated = await setPresetActive(id);
    if (!updated) throw new Error(`Unknown camera preset: ${id}`);
    return updated;
  }

  async getStreamUrl(): Promise<string | null> {
    return (await getSiteConfig()).hlsUrl || null;
  }
}

export const storeCameraProvider = new StoreCameraProvider();
