import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSession,
  isAdminEnabled,
} from "@/lib/admin-auth";

/**
 * Failed-attempt throttle, per client address. In memory and per process,
 * which is the right shape for a single Hostinger node: it costs nothing and
 * blunts online guessing now that the password can be operator-chosen.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || "unknown";
}

export async function POST(request: Request) {
  if (!(await isAdminEnabled())) {
    return Response.json(
      { error: "Admin desabilitado. Defina ADMIN_PASSWORD." },
      { status: 503 }
    );
  }

  const key = clientKey(request);
  if (!rateLimit(key)) {
    return Response.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!(await checkPassword(password))) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const session = await createSession();
  if (!session) {
    return Response.json({ error: "Admin desabilitado." }, { status: 503 });
  }

  // A successful login clears the throttle for this address.
  attempts.delete(key);

  const store = await cookies();
  store.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });

  return Response.json({ ok: true });
}
