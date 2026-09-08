import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Password gate for /admin. The password lives in ADMIN_PASSWORD (never in
 * code/repo). A successful login gets a signed, expiring cookie (HMAC over
 * the expiry, keyed by the password) — no session store needed. If
 * ADMIN_PASSWORD is unset, the admin panel is disabled entirely.
 */
export const ADMIN_COOKIE = "olhar_admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ADMIN_COOKIE_MAX_AGE = Math.floor(TTL_MS / 1000);

function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

export function isAdminEnabled(): boolean {
  return adminPassword() !== null;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const secret = adminPassword();
  return secret !== null && safeEqual(input, secret);
}

export function createToken(): string | null {
  const secret = adminPassword();
  if (!secret) return null;
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp, secret)}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  const secret = adminPassword();
  if (!secret || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!safeEqual(sig, sign(exp, secret))) return false;
  return Number(exp) > Date.now();
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}
