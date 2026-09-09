"use server";

import { getCameraProvider } from "@/providers";
import type { CameraPreset, CameraPresetId } from "@/providers/camera/camera-provider";

/**
 * Move the camera to a preset.
 *
 * This exists as a Server Action rather than a direct provider call from the
 * client for two reasons. First, correctness: the provider holds the active
 * preset, so calling it from the browser mutated a per-tab copy that no other
 * viewer — and no server render — ever saw. Second, layering: importing
 * @/providers from a client component pulled the weather and streaming
 * providers into the client bundle, where their server-side env reads are
 * undefined, and it would hard-fail the build as soon as a provider reaches
 * for the server-only store.
 */
export async function gotoPresetAction(id: CameraPresetId): Promise<CameraPreset> {
  return getCameraProvider().gotoPreset(id);
}
