import { Film, Info, Loader, Play, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getTimelapses,
  type Timelapse,
  type TimelapseStatus,
} from "@/mocks/timelapse";

const STATUS: Record<
  TimelapseStatus,
  { label: string; className: string }
> = {
  ready: { label: "Pronto", className: "border-emerald-500/40 text-emerald-400" },
  processing: { label: "Processando", className: "border-amber-500/40 text-amber-400" },
  pending: { label: "Na fila", className: "text-muted-foreground" },
  failed: { label: "Falhou", className: "border-red-500/40 text-red-400" },
};

function formatPeriod(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const d = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const t = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = d(start) === d(end);
  return sameDay
    ? `${d(start)} · ${t(start)}–${t(end)}`
    : `${d(start)} ${t(start)} → ${d(end)} ${t(end)}`;
}

function Thumbnail({ status }: { status: TimelapseStatus }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-b from-slate-600 via-slate-800 to-black">
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
      <div className="absolute inset-0 flex items-center justify-center">
        {status === "ready" && (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Play className="h-5 w-5 fill-white text-white" />
          </span>
        )}
        {status === "processing" && (
          <Loader className="h-6 w-6 animate-spin text-white/80" />
        )}
        {status === "failed" && (
          <TriangleAlert className="h-6 w-6 text-red-300" />
        )}
      </div>
    </div>
  );
}

function TimelapseCard({ item }: { item: Timelapse }) {
  const status = STATUS[item.status];
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Thumbnail status={item.status} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{item.title}</h3>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-auto flex flex-col gap-1 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Período</span>
            <span className="text-foreground">
              {formatPeriod(item.startsAt, item.endsAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Frames</span>
            <span className="text-foreground">
              {item.frameCount > 0 ? item.frameCount.toLocaleString("pt-BR") : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duração</span>
            <span className="text-foreground">
              {item.durationSeconds > 0 ? `${item.durationSeconds}s` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimelapsePage() {
  const timelapses = getTimelapses();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Film className="h-5 w-5 text-muted-foreground" />
          Timelapse
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Sequências aceleradas geradas a partir dos frames capturados pela
          câmera — nascer e pôr do sol, neblina no vale, frentes chegando.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {timelapses.map((item) => (
          <TimelapseCard key={item.id} item={item} />
        ))}
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Área reservada: os timelapses acima são exemplos simulados. A geração
            real a partir dos frames da câmera e a reprodução dos vídeos serão
            habilitadas quando a câmera estiver instalada e transmitindo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
