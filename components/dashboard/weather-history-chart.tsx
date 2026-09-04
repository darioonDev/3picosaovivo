"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { METRICS, RANGES, RANGE_LABELS, formatTick } from "@/lib/weather-metrics";
import type { HistoricalPoint, HistoryRange } from "@/providers/weather/weather-provider";

interface WeatherHistoryChartProps {
  data: Record<HistoryRange, HistoricalPoint[]>;
}

export function WeatherHistoryChart({ data }: WeatherHistoryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico meteorológico</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="24h">
          <TabsList>
            {RANGES.map((range) => (
              <TabsTrigger key={range} value={range}>
                {RANGE_LABELS[range]}
              </TabsTrigger>
            ))}
          </TabsList>
          {RANGES.map((range) => (
            <TabsContent key={range} value={range} className="mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {METRICS.map((metric) => {
                  const config = {
                    [metric.key]: { label: metric.label, color: metric.color },
                  } satisfies ChartConfig;

                  return (
                    <div
                      key={metric.key}
                      className="flex flex-col gap-1.5 rounded-lg border border-border/60 p-3"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {metric.label} ({metric.unit})
                      </span>
                      <ChartContainer config={config} className="aspect-auto h-32 w-full">
                        <AreaChart
                          data={data[range]}
                          margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => formatTick(range, value)}
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            minTickGap={24}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(value) =>
                                  formatTick(range, value as string)
                                }
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
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
