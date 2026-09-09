import "server-only";

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { CAMERA_PRESETS } from "@/mocks/camera";
import { SEED_ALERTS } from "@/mocks/alerts";
import type { CameraPreset } from "@/providers/camera/camera-provider";

/**
 * Server-side JSON store for admin-managed state: camera presets and weather
 * alerts. It's the source of truth the admin panel writes to and the
 * dashboard/pages read from, so edits actually take effect across the app
 * (the reading pages are dynamic).
 *
 * General settings used to live here too; they moved to the field registry in
 * lib/config/, which writes the "settings" branch of the SAME file. Both sides
 * read-modify-write the whole document, so neither clobbers the other.
 *
 * Seeded from the mocks on first read. Persisted to STORE_PATH — set that to
 * a path OUTSIDE the deploy directory on Hostinger so admin changes survive
 * redeploys. server-only keeps this out of the client bundle.
 */

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
  presets: CameraPreset[];
  alerts: WeatherAlert[];
}

function defaultState(): AdminState {
  return {
    presets: CAMERA_PRESETS.map((p) => ({ ...p, position: { ...p.position } })),
    alerts: SEED_ALERTS.map((a) => ({ ...a })),
  };
}

function storePath(): string {
  return process.env.STORE_PATH || path.join(process.cwd(), "olhar-data.json");
}

/** The whole document, including the "settings" branch lib/config/ owns. */
async function readFile(): Promise<Record<string, unknown>> {
  try {
    // turbopackIgnore: the store lives OUTSIDE the deploy directory by design.
    const raw = await fs.readFile(/*turbopackIgnore: true*/ storePath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function readState(): Promise<AdminState> {
  const base = defaultState();
  const file = await readFile();
  return {
    presets: Array.isArray(file.presets) ? (file.presets as CameraPreset[]) : base.presets,
    alerts: Array.isArray(file.alerts) ? (file.alerts as WeatherAlert[]) : base.alerts,
  };
}

/**
 * Writes only the presets/alerts branches, preserving "settings" and "_auth".
 * Written atomically (tmp + rename) so a crash mid-write cannot truncate the
 * file and silently reset everything.
 */
async function writeState(state: AdminState): Promise<void> {
  const file = await readFile();
  file.presets = state.presets;
  file.alerts = state.alerts;

  const target = storePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(file, null, 2), "utf8");
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.unlink(tmp).catch(() => {});
    throw error;
  }
}

// ---- Reads ----
export async function getState(): Promise<AdminState> {
  return readState();
}

export async function getPresets(): Promise<CameraPreset[]> {
  return (await readState()).presets;
}

export async function getAlerts(): Promise<WeatherAlert[]> {
  return (await readState()).alerts;
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

/** Mark one preset active and the rest idle, persisting the change. */
export async function setPresetActive(id: string): Promise<CameraPreset | null> {
  const state = await readState();
  const target = state.presets.find((p) => p.id === id);
  if (!target) return null;

  state.presets = state.presets.map((p) => ({
    ...p,
    status: p.id === id ? "active" : "idle",
  }));
  await writeState(state);
  return { ...target, status: "active" };
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
