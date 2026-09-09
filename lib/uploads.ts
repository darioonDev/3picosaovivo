import "server-only";

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { settingsPath } from "@/lib/config/resolve";

/**
 * Storage for images uploaded through the admin panel. Shared verbatim with
 * the twin repository — see scripts/check-shared.mjs.
 *
 * Files land beside this app's settings file — i.e. OUTSIDE the deploy
 * directory, wherever settingsPath() resolves to — so they survive a redeploy.
 * They cannot go
 * in public/: with output: "standalone" that folder is copied at build time
 * and anything written there at runtime is never served.
 *
 * Serving therefore goes through /api/asset/[name] (see that route).
 */

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Accepted types, keyed by the extension we store them under. */
const TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
} as const;

export type Extension = keyof typeof TYPES;

export function contentTypeFor(ext: string): string | null {
  return (TYPES as Record<string, string>)[ext] ?? null;
}

export function uploadsDir(): string {
  return process.env.UPLOADS_PATH || path.join(path.dirname(settingsPath()), "uploads");
}

/**
 * Identify the image from its actual bytes, not the declared Content-Type —
 * a client can claim anything. SVG is deliberately unsupported: served from
 * our own origin it can carry inline script, which would be stored XSS
 * against /admin.
 */
export function sniffExtension(buf: Buffer): Extension | null {
  if (buf.length < 12) return null;

  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "png";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

/** Only names this module generates can ever be read back. */
const NAME_RE = /^[a-z0-9]+-[0-9a-f]{8}\.(png|jpg|webp)$/i;

export function isValidAssetName(name: string): boolean {
  return NAME_RE.test(name);
}

export async function isWritable(): Promise<boolean> {
  try {
    await fs.mkdir(uploadsDir(), { recursive: true });
    await fs.access(uploadsDir(), (await import("node:fs")).constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Write the buffer under a generated name and return the public URL path. */
export async function saveUpload(
  fieldKey: string,
  buf: Buffer,
  ext: Extension
): Promise<string> {
  const dir = uploadsDir();
  await fs.mkdir(dir, { recursive: true });

  // The name is generated, never taken from the client — no traversal surface,
  // and the random suffix makes every upload a fresh, immutably cacheable URL.
  const slug = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, "") || "asset";
  const name = `${slug}-${randomBytes(4).toString("hex")}.${ext}`;
  const target = path.join(dir, name);

  const tmp = `${target}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    await fs.writeFile(tmp, buf);
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.unlink(tmp).catch(() => {});
    throw error;
  }

  return `/api/asset/${name}`;
}

/** Read one stored asset, or null when it is absent. */
export async function readAsset(
  name: string
): Promise<{ body: Buffer; contentType: string } | null> {
  if (!isValidAssetName(name)) return null;

  const dir = uploadsDir();
  const target = path.resolve(dir, name);
  // Belt and braces: the name pattern already forbids separators.
  if (path.dirname(target) !== path.resolve(dir)) return null;

  const ext = path.extname(name).slice(1).toLowerCase();
  const contentType = contentTypeFor(ext);
  if (!contentType) return null;

  try {
    return { body: await fs.readFile(target), contentType };
  } catch {
    return null;
  }
}

/** Remove a previously uploaded asset, ignoring anything else. */
export async function deleteAsset(url: string): Promise<void> {
  const name = url.startsWith("/api/asset/") ? url.slice("/api/asset/".length) : null;
  if (!name || !isValidAssetName(name)) return;
  await fs.unlink(path.join(uploadsDir(), name)).catch(() => {});
}
