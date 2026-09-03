import type { CameraPreset, CameraStatus } from "@/providers/camera/camera-provider";

export const CAMERA_STATUS: CameraStatus = {
  connected: true,
  cameraName: "Câmera PTZ — Mascarin",
  resolution: "1920×1080 (simulado)",
  connectionStatus: "online",
  lastUpdatedAt: new Date().toISOString(),
};

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: "visao-geral",
    name: "Visão Geral",
    description: "Enquadramento amplo do vale, ponto de partida padrão da câmera.",
    position: { pan: 0, tilt: -5, zoom: 1 },
    status: "active",
  },
  {
    id: "tres-picos",
    name: "Três Picos",
    description: "Zoom nos três picos que dão nome ao parque.",
    position: { pan: 22, tilt: 8, zoom: 6 },
    status: "idle",
  },
  {
    id: "cabeca-do-dragao",
    name: "Cabeça do Dragão",
    description: "Formação rochosa a leste, referência para trilhas.",
    position: { pan: 48, tilt: 4, zoom: 10 },
    status: "idle",
  },
  {
    id: "pico-maior",
    name: "Pico Maior",
    description: "Ponto mais alto do maciço, com maior aproximação óptica.",
    position: { pan: 18, tilt: 12, zoom: 18 },
    status: "idle",
  },
  {
    id: "pico-medio",
    name: "Pico Médio",
    description: "Pico intermediário, à direita do Pico Maior.",
    position: { pan: 26, tilt: 10, zoom: 16 },
    status: "idle",
  },
  {
    id: "pico-menor",
    name: "Pico Menor",
    description: "Pico mais baixo do trio, encosta com vegetação mais densa.",
    position: { pan: 33, tilt: 7, zoom: 14 },
    status: "idle",
  },
  {
    id: "horizonte",
    name: "Horizonte",
    description: "Varredura no horizonte, útil para observar frentes de nuvens.",
    position: { pan: -40, tilt: -2, zoom: 3 },
    status: "idle",
  },
];
