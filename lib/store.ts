import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { CAMERA_PRESETS } from "@/mocks/camera";
import { SEED_ALERTS } from "@/mocks/alerts";
import type { CameraPreset } from "@/providers/camera/camera-provider";

/**
 * Server-side JSON store for admin-managed state: general settings, camera
 * presets, and weather alerts. It's the source of truth the admin panel
 * writes to and the dashboard/pages read from, so edits actually take effect
 * across the app (the reading pages are dynamic).
 *
 * Seeded from the mocks on first read. Persisted to STORE_PATH — set that to
 * a path OUTSIDE the deploy directory on Hostinger so admin changes survive
 * redeploys. server-only keeps this out of the client bundle.
 */

export interface SiteSettings {
  siteName: string;
  tagline: string;
  locationLabel: string;
  cameraName: string;
  cameraResolution: string;
  updateIntervalSeconds: number;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface AdminState {
  settings: SiteSettings;
  presets: CameraPreset[];
  alerts: WeatherAlert[];
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Olhar dos Três Picos",
  tagline: "Monitoramento visual e meteorológico das montanhas",
  locationLabel: "Mascarin • Nova Friburgo • RJ",
  cameraName: "Câmera PTZ — Mascarin",
  cameraResolution: "1920×1080 (simulado)",
  updateIntervalSeconds: 60,
};

function defaultState(): AdminState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    presets: CAMERA_PRESETS.map((p) => ({ ...p, position: { ...p.position } })),
    alerts: SEED_ALERTS.map((a) => ({ ...a })),
  };
}

function storePath(): string {
  return process.env.STORE_PATH || path.join(process.cwd(), "olhar-data.json");
}

async function readState(): Promise<AdminState> {
  const base = defaultState();
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminState>;
    return {
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      presets: Array.isArray(parsed.presets) ? parsed.presets : base.presets,
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : base.alerts,
    };
  } catch {
    return base;
  }
}

async function writeState(state: AdminState): Promise<void> {
  const target = storePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(state, null, 2), "utf8");
}

// ---- Reads ----
export async function getState(): Promise<AdminState> {
  return readState();
}

export async function getSettings(): Promise<SiteSettings> {
  return (await readState()).settings;
}

export async function getPresets(): Promise<CameraPreset[]> {
  return (await readState()).presets;
}

export async function getAlerts(): Promise<WeatherAlert[]> {
  return (await readState()).alerts;
}

// ---- Settings ----
export async function saveSettings(patch: Partial<SiteSettings>): Promise<void> {
  const state = await readState();
  state.settings = { ...state.settings, ...sanitizeSettings(patch) };
  await writeState(state);
}

function sanitizeSettings(patch: Partial<SiteSettings>): Partial<SiteSettings> {
  const out: Partial<SiteSettings> = {};
  if (typeof patch.siteName === "string") out.siteName = patch.siteName.trim();
  if (typeof patch.tagline === "string") out.tagline = patch.tagline.trim();
  if (typeof patch.locationLabel === "string") out.locationLabel = patch.locationLabel.trim();
  if (typeof patch.cameraName === "string") out.cameraName = patch.cameraName.trim();
  if (typeof patch.cameraResolution === "string")
    out.cameraResolution = patch.cameraResolution.trim();
  if (typeof patch.updateIntervalSeconds === "number" && patch.updateIntervalSeconds > 0)
    out.updateIntervalSeconds = Math.round(patch.updateIntervalSeconds);
  return out;
}

// ---- Presets (CRUD) ----
export interface PresetInput {
  id?: string;
  name: string;
  description: string;
  pan: number;
  tilt: number;
  zoom: number;
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "preset"
  );
}

export async function upsertPreset(input: PresetInput): Promise<CameraPreset> {
  const state = await readState();
  const preset: CameraPreset = {
    id: input.id?.trim() || uniqueId(slugify(input.name), state.presets),
    name: input.name.trim(),
    description: input.description.trim(),
    position: { pan: input.pan, tilt: input.tilt, zoom: input.zoom },
    status: "idle",
  };

  const index = state.presets.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    // Preserve the existing active status on edit.
    preset.status = state.presets[index].status;
    state.presets[index] = preset;
  } else {
    state.presets.push(preset);
  }
  await writeState(state);
  return preset;
}

function uniqueId(base: string, presets: CameraPreset[]): string {
  const ids = new Set(presets.map((p) => p.id));
  if (!ids.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!ids.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function deletePreset(id: string): Promise<void> {
  const state = await readState();
  state.presets = state.presets.filter((p) => p.id !== id);
  await writeState(state);
}

// ---- Alerts ----
export interface AlertInput {
  severity: AlertSeverity;
  title: string;
  description: string;
}

export async function addAlert(input: AlertInput): Promise<WeatherAlert> {
  const state = await readState();
  const alert: WeatherAlert = {
    id: `alert-${Date.now()}`,
    severity: input.severity,
    title: input.title.trim(),
    description: input.description.trim(),
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };
  state.alerts = [alert, ...state.alerts];
  await writeState(state);
  return alert;
}

export async function setAlertAcknowledged(id: string, acknowledged: boolean): Promise<void> {
  const state = await readState();
  state.alerts = state.alerts.map((a) => (a.id === id ? { ...a, acknowledged } : a));
  await writeState(state);
}

export async function deleteAlert(id: string): Promise<void> {
  const state = await readState();
  state.alerts = state.alerts.filter((a) => a.id !== id);
  await writeState(state);
}
