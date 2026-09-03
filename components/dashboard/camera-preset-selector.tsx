"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CameraPreset, CameraPresetId } from "@/providers/camera/camera-provider";

interface CameraPresetSelectorProps {
  presets: CameraPreset[];
  movingId: CameraPresetId | null;
  isPending: boolean;
  onSelect: (id: CameraPresetId) => void;
}

export function CameraPresetSelector({
  presets,
  movingId,
  isPending,
  onSelect,
}: CameraPresetSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pontos de observação</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {presets.map((preset) => {
          const isActive = preset.status === "active";
          const isMoving = isPending && movingId === preset.id;
          return (
            <Button
              key={preset.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              title={preset.description}
              disabled={isPending}
              onClick={() => onSelect(preset.id)}
              className="justify-start gap-2"
            >
              <span className="flex-1 text-left">{preset.name}</span>
              {isMoving && (
                <span className="text-[10px] text-muted-foreground">
                  movendo…
                </span>
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
