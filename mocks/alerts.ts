import type { WeatherAlert } from "@/lib/store";

/** Seed alerts used until the store is first written (and as CRUD examples). */
export const SEED_ALERTS: WeatherAlert[] = [
  {
    id: "alert-frente-fria",
    severity: "warning",
    title: "Frente fria se aproximando",
    description: "Queda de temperatura e ventos fortes previstos para as próximas 24 h.",
    createdAt: "2026-09-04T09:00:00-03:00",
    acknowledged: false,
  },
  {
    id: "alert-neblina",
    severity: "info",
    title: "Neblina densa no vale",
    description: "Visibilidade reduzida ao amanhecer — atenção em trilhas.",
    createdAt: "2026-09-04T06:10:00-03:00",
    acknowledged: false,
  },
  {
    id: "alert-bateria",
    severity: "critical",
    title: "Bateria da estação abaixo de 20%",
    description: "Geração solar insuficiente nos últimos dias; risco de queda de sinal.",
    createdAt: "2026-09-03T18:40:00-03:00",
    acknowledged: true,
  },
];
