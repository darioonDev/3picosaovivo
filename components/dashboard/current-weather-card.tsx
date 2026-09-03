import { CloudRain, Droplets, Eye, Gauge, Sun, Thermometer, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrentConditions } from "@/providers/weather/weather-provider";

interface CurrentWeatherCardProps {
  conditions: CurrentConditions;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour12: false });
}

export function CurrentWeatherCard({ conditions }: CurrentWeatherCardProps) {
  const metrics = [
    { icon: Droplets, label: "Umidade", value: `${conditions.humidityPct}%` },
    {
      icon: Wind,
      label: "Vento",
      value: `${conditions.windSpeedKmh} km/h ${conditions.windDirection}`,
    },
    { icon: Gauge, label: "Pressão", value: `${conditions.pressureHpa} hPa` },
    {
      icon: CloudRain,
      label: "Chuva",
      value: `${conditions.rainMmPerHour.toFixed(1)} mm/h`,
    },
    { icon: Eye, label: "Visibilidade", value: `${conditions.visibilityKm} km` },
    ...(conditions.solarRadiationWm2 != null
      ? [
          {
            icon: Sun,
            label: "Radiação solar",
            value: `${conditions.solarRadiationWm2} W/m²`,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Condições atuais</CardTitle>
        <Badge variant="secondary" className="font-mono text-[10px]">
          observado (simulado) · {formatTime(conditions.observedAt)}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <Thermometer className="mb-1 h-5 w-5 text-muted-foreground" />
          <span className="font-mono text-4xl font-semibold tabular-nums">
            {conditions.temperatureC.toFixed(1)}
          </span>
          <span className="mb-1 text-lg text-muted-foreground">°C</span>
        </div>
        <div className="grid grid-cols-2 gap-3 font-mono text-sm">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-2"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  {label}
                </span>
                <span>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
