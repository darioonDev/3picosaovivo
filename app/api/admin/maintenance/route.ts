import { isAuthenticated } from "@/lib/admin-auth";
import {
  exportSettings,
  getDiagnostics,
  resetSettings,
  saveSiteConfig,
} from "@/lib/config/resolve";

/** Diagnostics for the maintenance panel. */
export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({
    diagnostics: await getDiagnostics(),
    settings: await exportSettings(),
  });
}

/**
 * Maintenance actions: restore defaults, or import a previously exported file.
 * Import goes through saveSiteConfig, so every value is validated by the same
 * registry rules as a normal save — a hand-edited backup cannot inject
 * unknown keys or out-of-range values.
 */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    if (body.action === "reset") {
      await resetSettings();
      return Response.json({ ok: true, reset: true });
    }

    if (body.action === "import") {
      const values = body.settings;
      if (!values || typeof values !== "object" || Array.isArray(values)) {
        return Response.json(
          { error: "Arquivo inválido: esperado um objeto de configurações." },
          { status: 400 }
        );
      }
      const result = await saveSiteConfig(values as Record<string, unknown>);
      return Response.json({ ok: true, ...result });
    }
  } catch (error) {
    console.error("[api/admin/maintenance] failed:", error);
    return Response.json(
      { error: "Não foi possível concluir a operação no servidor." },
      { status: 500 }
    );
  }

  return Response.json({ error: "Ação desconhecida." }, { status: 400 });
}
