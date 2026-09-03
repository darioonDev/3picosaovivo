import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import type { SkyCondition } from "@/providers/forecast/forecast-provider";

export const CONDITION_ICONS: Record<SkyCondition, typeof Sun> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
};

export const CONDITION_LABELS: Record<SkyCondition, string> = {
  clear: "Céu limpo",
  "partly-cloudy": "Parcialmente nublado",
  cloudy: "Nublado",
  rain: "Chuva",
  storm: "Tempestade",
  fog: "Neblina",
};
