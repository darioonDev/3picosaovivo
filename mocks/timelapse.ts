/**
 * Timelapse gallery data. No formal provider interface (like system-status,
 * it wasn't asked for one) — the page reads this mock directly. Kept here,
 * not in the component, so it stays swappable when real timelapses are
 * generated from captured frames (see the `timelapses` table in db/schema.sql).
 *
 * Deliberately no video URLs: there is no real footage yet, so nothing here
 * pretends to be a playable clip.
 */
export type TimelapseStatus = "ready" | "processing" | "pending" | "failed";

export interface Timelapse {
  id: string;
  title: string;
  description: string;
  /** Capture window (ISO-8601). */
  startsAt: string;
  endsAt: string;
  frameCount: number;
  /** Rendered clip length in seconds. */
  durationSeconds: number;
  status: TimelapseStatus;
}

export function getTimelapses(): Timelapse[] {
  return [
    {
      id: "nascer-do-sol-tres-picos",
      title: "Nascer do sol nos Três Picos",
      description: "Amanhecer sobre o maciço, do primeiro clarão ao sol pleno.",
      startsAt: "2026-09-03T05:30:00-03:00",
      endsAt: "2026-09-03T07:30:00-03:00",
      frameCount: 720,
      durationSeconds: 30,
      status: "ready",
    },
    {
      id: "neblina-no-vale",
      title: "Neblina subindo o vale",
      description: "Formação e dissipação da neblina matinal sobre Mascarin.",
      startsAt: "2026-09-02T06:00:00-03:00",
      endsAt: "2026-09-02T09:00:00-03:00",
      frameCount: 1080,
      durationSeconds: 36,
      status: "ready",
    },
    {
      id: "por-do-sol-cabeca-do-dragao",
      title: "Pôr do sol — Cabeça do Dragão",
      description: "Fim de tarde iluminando a formação rochosa a leste.",
      startsAt: "2026-09-01T16:30:00-03:00",
      endsAt: "2026-09-01T18:30:00-03:00",
      frameCount: 720,
      durationSeconds: 24,
      status: "ready",
    },
    {
      id: "dia-completo-visao-geral",
      title: "Dia completo — Visão Geral",
      description: "Do amanhecer ao anoitecer no enquadramento amplo do vale.",
      startsAt: "2026-09-03T06:00:00-03:00",
      endsAt: "2026-09-03T18:00:00-03:00",
      frameCount: 4320,
      durationSeconds: 60,
      status: "processing",
    },
    {
      id: "frente-fria-chegando",
      title: "Frente fria chegando",
      description: "Captura agendada para o avanço da próxima frente fria.",
      startsAt: "2026-09-05T00:00:00-03:00",
      endsAt: "2026-09-05T23:59:00-03:00",
      frameCount: 0,
      durationSeconds: 0,
      status: "pending",
    },
    {
      id: "tempestade-sobre-os-picos",
      title: "Tempestade sobre os picos",
      description: "Interrompida por perda de sinal da câmera durante o evento.",
      startsAt: "2026-08-30T14:00:00-03:00",
      endsAt: "2026-08-30T16:00:00-03:00",
      frameCount: 210,
      durationSeconds: 0,
      status: "failed",
    },
  ];
}
