/**
 * Infrastructure status isn't behind a formal provider interface (it wasn't
 * asked for one) — SystemStatusPanel reads this mock directly. Kept here,
 * not scattered in the component, so it stays swappable later.
 */
export type SystemComponentStatus = "online" | "offline" | "normal" | "low";

export interface SystemComponentReading {
  id: string;
  label: string;
  status: SystemComponentStatus;
  detail?: string;
}

export interface SystemStatusSnapshot {
  checkedAt: string;
  components: SystemComponentReading[];
}

export function getSystemStatus(): SystemStatusSnapshot {
  return {
    checkedAt: new Date().toISOString(),
    components: [
      { id: "camera", label: "Câmera PTZ", status: "online" },
      { id: "weather-station", label: "Estação meteorológica", status: "online" },
      { id: "internet", label: "Internet", status: "online" },
      { id: "server", label: "Servidor", status: "online" },
      { id: "solar", label: "Alimentação solar", status: "normal" },
      { id: "battery", label: "Bateria", status: "normal", detail: "87%" },
    ],
  };
}
