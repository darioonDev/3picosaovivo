import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  checkPassword,
  createToken,
  isAdminEnabled,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return Response.json(
      { error: "Admin desabilitado. Defina ADMIN_PASSWORD." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = createToken();
  if (!token) {
    return Response.json({ error: "Admin desabilitado." }, { status: 503 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true });
}
