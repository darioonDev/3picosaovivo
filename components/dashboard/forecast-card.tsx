import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  DailyForecastPoint,
  HourlyForecastPoint,
} from "@/providers/forecast/forecast-provider";
import { CONDITION_ICONS, CONDITION_LABELS } from "./forecast-conditions";
import { ForecastTimeline } from "./forecast-timeline";

interface ForecastCardProps {
  hours: HourlyForecastPoint[];
  days: DailyForecastPoint[];
}

export function ForecastCard({ hours, days }: ForecastCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Próximas horas
          </span>
          <ForecastTimeline hours={hours} />
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Próximos dias
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {days.map((day) => {
              const Icon = CONDITION_ICONS[day.condition];
              return (
                <div
                  key={day.date}
                  title={CONDITION_LABELS[day.condition]}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 p-3 text-center"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {day.label}
                  </span>
                  <Icon className="h-6 w-6 text-sky-400" />
                  <span className="font-mono text-sm">
                    {Math.round(day.temperatureMaxC)}° /{" "}
                    {Math.round(day.temperatureMinC)}°
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {day.rainChancePct}% chuva
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
