"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  METRICS,
  RANGES,
  RANGE_LABELS,
  computeStats,
  formatStamp,
  formatTick,
  type MetricKey,
} from "@/lib/weather-metrics";
import type { HistoricalPoint, HistoryRange } from "@/providers/weather/weather-provider";

interface HistoryViewProps {
  data: Record<HistoryRange, HistoricalPoint[]>;
}

function fmt(value: number, decimals: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function toCsv(points: HistoricalPoint[]): string {
  const header = ["timestamp", ...METRICS.map((m) => m.key)].join(",");
  const rows = points.map((p) =>
    [p.timestamp, ...METRICS.map((m) => p[m.key])].join(",")
  );
  return [header, ...rows].join("\n");
}

export function HistoryView({ data }: HistoryViewProps) {
  const [range, setRange] = useState<HistoryRange>("24h");
  const [metricKey, setMetricKey] = useState<MetricKey>("temperatureC");

  const points = data[range];
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const chartConfig = useMemo(
    () => ({ [metric.key]: { label: metric.label, color: metric.color } }) satisfies ChartConfig,
    [metric]
  );

  function handleExport() {
    const blob = new Blob([toCsv(points)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-tres-picos-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Histórico meteorológico
          </h1>
          <p className="text-sm text-muted-foreground">
            Temperatura, umidade, pressão, vento e chuva ao longo do tempo.
            Dados observados (simulados).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download />
          Exportar CSV
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Button
            key={r}
            type="button"
            size="sm"
            variant={r === range ? "default" : "outline"}
            onClick={() => setRange(r)}
          >
            {RANGE_LABELS[r]}
          </Button>
        ))}
      </div>

      {/* Per-metric summary (min / avg / max) — lets you compare metrics at a glance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {METRICS.map((m) => {
          const stats = computeStats(points, m.key);
          return (
            <Card key={m.key} size="sm">
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {m.label} ({m.unit})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-baseline justify-between gap-2">
                {stats ? (
                  <>
                    <Stat label="mín" value={fmt(stats.min, m.decimals)} />
                    <Stat label="méd" value={fmt(stats.avg, m.decimals)} highlight />
                    <Stat label="máx" value={fmt(stats.max, m.decimals)} />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Focused chart with metric selector */}
      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Evolução — {RANGE_LABELS[range]}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <Button
                key={m.key}
                type="button"
                size="sm"
                variant={m.key === metricKey ? "default" : "outline"}
                onClick={() => setMetricKey(m.key)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <AreaChart data={points} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatTick(range, value)}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={40}
                tickFormatter={(v) => fmt(Number(v), metric.decimals)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatStamp(range, value as string)}
                  />
                }
              />
              <Area
                dataKey={metric.key}
                type="monotone"
                stroke={`var(--color-${metric.key})`}
                fill={`var(--color-${metric.key})`}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Raw data table */}
      <Card>
        <CardHeader>
          <CardTitle>Leituras — {RANGE_LABELS[range]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Data/hora</th>
                  {METRICS.map((m) => (
                    <th key={m.key} className="px-3 py-2 text-right font-medium">
                      {m.label} ({m.unit})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {points.map((p) => (
                  <tr key={p.timestamp} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                      {formatStamp(range, p.timestamp)}
                    </td>
                    {METRICS.map((m) => (
                      <td key={m.key} className="px-3 py-1.5 text-right tabular-nums">
                        {fmt(p[m.key], m.decimals)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${highlight ? "text-lg font-semibold" : "text-sm text-muted-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
