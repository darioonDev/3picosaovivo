import { Signal, SignalZero } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CameraStatus } from "@/providers/camera/camera-provider";

interface LiveCameraViewerProps {
  status: CameraStatus;
  activePresetName: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour12: false });
}

export function LiveCameraViewer({
  status,
  activePresetName,
}: LiveCameraViewerProps) {
  const online = status.connectionStatus === "online";

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-b from-slate-700 via-slate-900 to-black">
        {/* Placeholder de montanha — não é imagem real da câmera. */}
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-2/3 w-full text-black/70"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0 200 L55 95 L100 145 L165 45 L225 125 L275 75 L335 150 L400 105 L400 200 Z"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

        <div className="absolute top-4 left-4">
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-500/40 bg-black/40 text-emerald-400 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            AO VIVO
          </Badge>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 font-mono text-xs text-white/80 backdrop-blur">
          {online ? (
            <Signal className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <SignalZero className="h-3.5 w-3.5 text-red-400" />
          )}
          {online ? "Conectado" : "Sem sinal"}
        </div>

        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-2 font-mono text-white">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-white/60 uppercase">
              {status.cameraName}
            </p>
            <p className="text-sm text-white/90">{activePresetName}</p>
          </div>
          <div className="text-right text-xs text-white/60">
            <p>{status.resolution}</p>
            <p>Atualizado às {formatTime(status.lastUpdatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
