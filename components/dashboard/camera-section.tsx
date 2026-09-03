"use client";

import { useState, useTransition } from "react";
import { getCameraProvider } from "@/providers";
import type {
  CameraPreset,
  CameraPresetId,
  CameraStatus,
} from "@/providers/camera/camera-provider";
import type { CurrentConditions } from "@/providers/weather/weather-provider";
import { CameraPresetSelector } from "./camera-preset-selector";
import { CurrentWeatherCard } from "./current-weather-card";
import { LiveCameraViewer } from "./live-camera-viewer";

interface CameraSectionProps {
  status: CameraStatus;
  initialPresets: CameraPreset[];
  conditions: CurrentConditions;
}

/**
 * Owns the preset selection state so LiveCameraViewer's "current view" label
 * and CameraPresetSelector's highlighted button stay in sync — they're
 * siblings, so the state has to live here rather than in either of them.
 */
export function CameraSection({
  status,
  initialPresets,
  conditions,
}: CameraSectionProps) {
  const [presets, setPresets] = useState(initialPresets);
  const [movingId, setMovingId] = useState<CameraPresetId | null>(null);
  const [isPending, startTransition] = useTransition();

  const activePreset = presets.find((preset) => preset.status === "active");

  function handleSelect(id: CameraPresetId) {
    if (isPending) return;
    setMovingId(id);
    startTransition(async () => {
      const updated = await getCameraProvider().gotoPreset(id);
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === updated.id ? updated : { ...preset, status: "idle" }
        )
      );
      setMovingId(null);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <LiveCameraViewer
          status={status}
          activePresetName={activePreset?.name ?? "Visão Geral"}
        />
      </div>
      <div className="flex flex-col gap-6">
        <CameraPresetSelector
          presets={presets}
          movingId={movingId}
          isPending={isPending}
          onSelect={handleSelect}
        />
        <CurrentWeatherCard conditions={conditions} />
      </div>
    </div>
  );
}
