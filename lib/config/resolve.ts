import "server-only";

import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { SECTIONS, type FieldView, type SectionId } from "./kinds";
import {
  FIELDS,
  FIELD_ENTRIES,
  isPublicField,
  type Field,
  type FieldKey,
  type PublicConfig,
  type SiteConfig,
} from "./schema";

/**
 * Runtime site configuration. Values come from a writable JSON file (edited in
 * /admin) and fall back to environment variables, then to the field's
 * hardcoded default. Everything is read per request, so an admin change takes
 * effect without a redeploy.
 *
 * Twin of camera-24h/lib/config/resolve.ts. The one structural difference:
 * this app's file also holds presets and alerts (lib/store.ts owns those), so
 * settings live under a "settings" key and every write preserves its siblings.
 */

type StoredSettings = Partial<Record<FieldKey, unknown>>;

// Defaults to the app dir; set STORE_PATH to a location OUTSIDE the deploy
// directory on Hostinger so admin-saved state survives redeploys.
export function settingsPath(): string {
  return process.env.STORE_PATH || path.join(process.cwd(), "olhar-data.json");
}

/** The whole file, including the presets/alerts that lib/store.ts owns. */
async function readFile(): Promise<Record<string, unknown>> {
  try {
    // turbopackIgnore: the store lives OUTSIDE the deploy directory by design.
    const raw = await fs.readFile(/*turbopackIgnore: true*/ settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function readStored(): Promise<StoredSettings> {
  const file = await readFile();
  const settings = file.settings;
  return settings && typeof settings === "object"
    ? (settings as StoredSettings)
    : {};
}

/**
 * Write via a temp file in the same directory, then rename. rename(2) is
 * atomic within a filesystem, so a crash mid-write can never leave a
 * truncated settings file — which would silently reset every setting.
 */
async function writeStored(next: StoredSettings): Promise<void> {
  // Read-modify-write the whole file so presets and alerts are never dropped.
  const file = await readFile();
  file.settings = next;
  await writeFile(file);
}

async function writeFile(file: Record<string, unknown>): Promise<void> {
  const target = settingsPath();
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

/** An env var that is unset OR empty counts as absent, so "" never wins over a default. */
function fromEnv(field: Field): unknown {
  if (!field.env) return undefined;
  const raw = process.env[field.env];
  return raw === undefined || raw === "" ? undefined : field.parse(raw);
}

function resolve(stored: StoredSettings): SiteConfig {
  const out: Record<string, unknown> = {};
  for (const [key, field] of FIELD_ENTRIES) {
    const fromStore = key in stored ? field.parse(stored[key]) : undefined;
    out[key] = fromStore ?? fromEnv(field) ?? field.fallback;
  }
  return out as SiteConfig;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return resolve(await readStored());
}

/**
 * The subset safe to hand to client components. Built by filtering the
 * registry rather than a hand-kept list, so marking a new field `secret`
 * removes it from the browser automatically.
 */
export async function getPublicConfig(): Promise<PublicConfig> {
  const config = await getSiteConfig();
  const out: Record<string, unknown> = {};
  for (const [key, field] of FIELD_ENTRIES) {
    if (isPublicField(field)) out[key] = config[key];
  }
  return out as PublicConfig;
}

export interface SaveResult {
  saved: FieldKey[];
  rejected: { key: string; reason: string }[];
}

/**
 * Merge a patch into the stored settings and persist.
 *
 * Semantics, unchanged from the original hand-written route:
 *  - an empty string on a normal field CLEARS it, so the env var applies again;
 *  - an empty string on a secret KEEPS the current value (blank means
 *    "leave it alone" in the form) — clearing one requires naming it in `clear`;
 *  - an omitted key is left untouched.
 *
 * `section` scopes the write: the Identidade form physically cannot rewrite the
 * admin password, even if the request body claims otherwise.
 */
export async function saveSiteConfig(
  patch: Record<string, unknown>,
  opts: { section?: SectionId; clear?: string[] } = {}
): Promise<SaveResult> {
  const next = await readStored();
  const saved: FieldKey[] = [];
  const rejected: { key: string; reason: string }[] = [];

  for (const [rawKey, rawValue] of Object.entries(patch)) {
    if (!(rawKey in FIELDS)) {
      rejected.push({ key: rawKey, reason: "campo desconhecido" });
      continue;
    }
    const key = rawKey as FieldKey;
    const field = FIELDS[key];

    if (opts.section && field.section !== opts.section) {
      rejected.push({ key, reason: "campo fora da seção enviada" });
      continue;
    }

    if (typeof rawValue === "string" && rawValue.trim() === "") {
      // Blank on a secret means "keep the stored value".
      if (field.secret) continue;
      // Blank on an emptiable field is a real value the operator chose (hide
      // the footer, no menu items); blank elsewhere means "clear me", so the
      // env var or the shipped default applies again.
      if (field.emptiable) next[key] = field.kind === "list" ? [] : "";
      else delete next[key];
      saved.push(key);
      continue;
    }

    const parsed = field.parse(rawValue);
    if (parsed === undefined) {
      rejected.push({ key, reason: "valor inválido" });
      continue;
    }
    next[key] = parsed;
    saved.push(key);
  }

  for (const rawKey of opts.clear ?? []) {
    if (!(rawKey in FIELDS)) continue;
    const key = rawKey as FieldKey;
    if (opts.section && FIELDS[key].section !== opts.section) continue;
    delete next[key];
    saved.push(key);
  }

  if (saved.length > 0) await writeStored(next);
  return { saved, rejected };
}

/** Serialisable field descriptions for one section, for the admin form. */
export async function getSectionFields(section: SectionId): Promise<FieldView[]> {
  const stored = await readStored();
  const config = resolve(stored);

  return FIELD_ENTRIES.filter(([, field]) => field.section === section).map(
    ([key, field]) => {
      const view: FieldView = {
        key,
        kind: field.kind,
        section: field.section,
        group: field.group,
        label: field.label,
        hint: field.hint,
        placeholder: field.placeholder,
        env: field.env,
        fromEnv: !(key in stored) && fromEnv(field) !== undefined,
      };
      if (field.kind === "select") view.options = field.options;
      if (field.kind === "list" && field.catalogue) {
        view.catalogue = field.catalogue.map((value) => ({
          value,
          label: field.catalogueLabels?.[value] ?? value,
        }));
      }
      if (field.kind === "number") {
        view.min = field.min;
        view.max = field.max;
        view.step = field.step;
        view.unit = field.unit;
      }
      view.emptiable = field.emptiable;
      if (field.secret) view.isSet = config[key] !== "";
      else view.value = config[key];
      return view;
    }
  );
}

/**
 * Sections to show in the menu, in order: those with at least one registry
 * field, plus those that exist only for a custom panel (alerts is fields-free
 * but has a full CRUD screen).
 */
const CUSTOM_PANEL_SECTIONS: readonly SectionId[] = ["alerts"];

export function getAvailableSections(): SectionId[] {
  const present = new Set(FIELD_ENTRIES.map(([, field]) => field.section));
  return SECTIONS.filter(
    (s) => present.has(s.id) || CUSTOM_PANEL_SECTIONS.includes(s.id)
  ).map((s) => s.id);
}

/**
 * Internal, non-operator state kept in the same file under a reserved key:
 * the admin password hash, its salt and version, and the cookie signing
 * secret. It deliberately lives OUTSIDE the field registry — the registry is
 * for things a person edits, and saveSiteConfig only ever touches keys it
 * knows, so this survives every settings write and can never be set by a
 * request body (unknown keys are rejected).
 */
const AUTH_KEY = "_auth";

export interface AuthState {
  passwordHash?: string;
  passwordSalt?: string;
  /** Bumped on every password change; embedded in the cookie to expire sessions. */
  passwordVersion?: number;
  sessionSecret?: string;
}

export async function readAuth(): Promise<AuthState> {
  const raw = (await readFile())[AUTH_KEY];
  return raw && typeof raw === "object" ? (raw as AuthState) : {};
}

export async function writeAuth(patch: AuthState): Promise<AuthState> {
  const file = await readFile();
  const current = await readAuth();
  const next = { ...current, ...patch };
  file[AUTH_KEY] = next;
  await writeFile(file);
  return next;
}

/** State of the settings file, for the maintenance panel. */
export async function getDiagnostics() {
  const target = settingsPath();
  const dir = path.dirname(target);
  let exists = false;
  let bytes = 0;
  try {
    const stat = await fs.stat(target);
    exists = true;
    bytes = stat.size;
  } catch {
    // Not written yet — that is a normal first-run state, not an error.
  }
  let writable = false;
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(dir, fsConstants.W_OK);
    writable = true;
  } catch {
    writable = false;
  }
  const stored = await readStored();
  const overridden = FIELD_ENTRIES.filter(([key]) => key in stored).map(([key]) => key);

  return { settingsPath: target, exists, bytes, writable, overridden };
}

/** Everything the operator has set, for the export/backup action. Secrets redacted. */
export async function exportSettings(): Promise<Record<string, unknown>> {
  const stored = await readStored();
  const out: Record<string, unknown> = {};
  for (const [key, field] of FIELD_ENTRIES) {
    if (!(key in stored)) continue;
    // Never place a secret in a file the operator may email or commit.
    if (field.secret) continue;
    out[key] = stored[key];
  }
  return out;
}

/** Remove every stored override, so env vars and defaults apply again. */
export async function resetSettings(): Promise<void> {
  const stored = await readStored();
  for (const [key] of FIELD_ENTRIES) delete stored[key];
  // Writes only the settings branch, so _auth, presets and alerts all survive.
  await writeStored(stored);
}
