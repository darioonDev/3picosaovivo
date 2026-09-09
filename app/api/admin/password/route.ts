import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSession,
  isAuthenticated,
  MIN_PASSWORD_LENGTH,
  setPassword,
} from "@/lib/admin-auth";

/**
 * Change the panel password. Requires the current one even though the caller
 * is already authenticated — a logged-in session left open on a shared
 * machine should not be enough to lock the owner out.
 */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let current = "";
  let next = "";
  try {
    const body = await request.json();
    current = typeof body?.current === "string" ? body.current : "";
    next = typeof body?.next === "string" ? body.next : "";
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!(await checkPassword(current))) {
    return Response.json({ error: "Senha atual incorreta." }, { status: 401 });
  }
  if (next.trim().length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `A nova senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }
  if (next === current) {
    return Response.json(
      { error: "A nova senha é igual à atual." },
      { status: 400 }
    );
  }

  try {
    await setPassword(next);
  } catch (error) {
    console.error("[api/admin/password] save failed:", error);
    return Response.json(
      { error: "Não foi possível gravar a nova senha no servidor." },
      { status: 500 }
    );
  }

  // Changing the password expires every session, including this one — reissue
  // a cookie so the operator is not logged out by their own action.
  const session = await createSession();
  if (session) {
    const store = await cookies();
    store.set(ADMIN_COOKIE, session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: session.maxAge,
    });
  }

  return Response.json({ ok: true });
}
