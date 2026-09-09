import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { readAuth, writeAuth } from "@/lib/config/resolve";

/**
 * Password gate for /admin.
 *
 * Originally ADMIN_PASSWORD played three roles at once: the credential, the
 * on/off switch, and the HMAC key for the session cookie. Now that the
 * password can be changed from the panel, those are separated:
 *
 *  - the credential is a scrypt hash in the settings file, with the
 *    ADMIN_PASSWORD env var kept as a permanent recovery path;
 *  - the cookie is signed with its own random secret, so rotating the
 *    password does not depend on the password being the key;
 *  - a version counter rides in the token, so changing the password does
 *    invalidate every existing session — deliberately.
 *
 * Twin of camera-24h/lib/admin-auth.ts.
 *
 * Recovery: if no hash is stored, the env var alone works exactly as before
 * (so an existing deployment keeps working untouched). If the panel password
 * is forgotten, deleting "_auth" from the settings file restores env-only
 * access.
 */
export const ADMIN_COOKIE = "olhar_admin";

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const KEY_LEN = 32;
/** Minimum length for a password set through the panel. */
export const MIN_PASSWORD_LENGTH = 12;

function envPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // scrypt throws at these parameters unless maxmem is raised.
    crypto.scrypt(password, salt, KEY_LEN, SCRYPT, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** The panel is available when either a stored password or the env var exists. */
export async function isAdminEnabled(): Promise<boolean> {
  if (envPassword() !== null) return true;
  return (await readAuth()).passwordHash !== undefined;
}

export async function checkPassword(input: string): Promise<boolean> {
  const auth = await readAuth();

  if (auth.passwordHash && auth.passwordSalt) {
    const salt = Buffer.from(auth.passwordSalt, "base64url");
    const candidate = (await scrypt(input, salt)).toString("base64url");
    if (safeEqual(candidate, auth.passwordHash)) return true;
  }

  // Recovery path — also the entire mechanism before a password is ever set.
  const env = envPassword();
  return env !== null && safeEqual(input, env);
}

/** Replace the stored password and invalidate every existing session. */
export async function setPassword(next: string): Promise<void> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(next, salt);
  const current = await readAuth();
  await writeAuth({
    passwordHash: hash.toString("base64url"),
    passwordSalt: salt.toString("base64url"),
    passwordVersion: (current.passwordVersion ?? 0) + 1,
    // Rotate the signing secret too, so old cookies cannot be replayed even
    // if the version check were ever bypassed.
    sessionSecret: crypto.randomBytes(32).toString("base64url"),
  });
}

/** Whether a panel-set password exists (vs. running on the env var alone). */
export async function hasStoredPassword(): Promise<boolean> {
  return (await readAuth()).passwordHash !== undefined;
}

/**
 * The cookie signing key. Persisted on first use; when the settings file is
 * unwritable it falls back to a value derived from the env password, which
 * reproduces the original behaviour rather than failing closed.
 */
async function sessionSecret(): Promise<string | null> {
  const auth = await readAuth();
  if (auth.sessionSecret) return auth.sessionSecret;

  const generated = crypto.randomBytes(32).toString("base64url");
  try {
    await writeAuth({ sessionSecret: generated });
    return generated;
  } catch {
    const env = envPassword();
    if (!env) return null;
    return crypto
      .createHmac("sha256", env)
      .update("sentinela-session-v1")
      .digest("base64url");
  }
}

async function sessionDays(): Promise<number> {
  // Imported lazily to avoid a cycle: config/resolve imports nothing from here.
  const { getSiteConfig } = await import("@/lib/config/resolve");
  return (await getSiteConfig()).adminSessionDays;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export async function createSession(): Promise<{ token: string; maxAge: number } | null> {
  const secret = await sessionSecret();
  if (!secret) return null;

  const days = await sessionDays();
  const maxAge = Math.floor(days * 24 * 60 * 60);
  const auth = await readAuth();
  const version = auth.passwordVersion ?? 0;
  const exp = String(Date.now() + maxAge * 1000);
  const payload = `${exp}.${version}`;

  return { token: `${payload}.${sign(payload, secret)}`, maxAge };
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = await sessionSecret();
  if (!secret) return false;

  const [exp, version, sig] = token.split(".");
  if (!exp || version === undefined || !sig) return false;
  if (!safeEqual(sig, sign(`${exp}.${version}`, secret))) return false;
  if (Number(exp) <= Date.now()) return false;

  // A password change bumps the version, expiring sessions issued before it.
  const current = (await readAuth()).passwordVersion ?? 0;
  return Number(version) === current;
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}
