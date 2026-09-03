import type { HourlyForecastPoint } from "@/providers/forecast/forecast-provider";
import { CONDITION_ICONS, CONDITION_LABELS } from "./forecast-conditions";

interface ForecastTimelineProps {
  hours: HourlyForecastPoint[];
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ForecastTimeline({ hours }: ForecastTimelineProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {hours.map((hour) => {
        const Icon = CONDITION_ICONS[hour.condition];
        return (
          <div
            key={hour.timestamp}
            title={CONDITION_LABELS[hour.condition]}
            className="flex min-w-[72px] flex-col items-center gap-1 rounded-lg border border-border/60 px-2.5 py-2.5"
          >
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatHour(hour.timestamp)}
            </span>
            <Icon className="h-4 w-4 text-sky-400" />
            <span className="font-mono text-sm">
              {Math.round(hour.temperatureC)}°
            </span>
            <span className="text-[10px] text-muted-foreground">
              {hour.rainChancePct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
