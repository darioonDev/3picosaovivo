import { isAuthenticated } from "@/lib/admin-auth";
import { SECTIONS, type SectionId } from "@/lib/config/kinds";
import { saveSiteConfig } from "@/lib/config/resolve";

/**
 * Persists a patch of settings. Validation is no longer hand-written per
 * field: saveSiteConfig walks the registry (lib/config/schema.ts), so a field
 * added there is validated here automatically.
 *
 * The optional `section` scopes the write to one panel section — a form can
 * only ever rewrite its own fields, whatever the body claims.
 */
function asSection(raw: unknown): SectionId | undefined {
  return SECTIONS.some((s) => s.id === raw) ? (raw as SectionId) : undefined;
}

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

  // Two shapes are accepted: the flat legacy body (every key at the top level)
  // and the sectioned one ({ section, values, clear }) the new panel sends.
  const sectioned = body.values !== undefined && typeof body.values === "object";
  const values = sectioned ? (body.values as Record<string, unknown>) : body;
  const section = asSection(body.section);
  const clear = Array.isArray(body.clear)
    ? body.clear.filter((k): k is string => typeof k === "string")
    : undefined;

  let result;
  try {
    result = await saveSiteConfig(values, { section, clear });
  } catch (error) {
    console.error("[api/admin/settings] save failed:", error);
    return Response.json(
      { error: "Não foi possível gravar as configurações no servidor." },
      { status: 500 }
    );
  }

  // A body that named only unknown or out-of-section fields is a client bug —
  // report it instead of answering ok and silently changing nothing.
  if (result.saved.length === 0 && result.rejected.length > 0) {
    return Response.json(
      {
        error: `Nenhum campo salvo: ${result.rejected
          .map((r) => `${r.key} (${r.reason})`)
          .join(", ")}.`,
        rejected: result.rejected,
      },
      { status: 400 }
    );
  }

  return Response.json({ ok: true, saved: result.saved, rejected: result.rejected });
}
