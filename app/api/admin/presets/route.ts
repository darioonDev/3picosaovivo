import { isAuthenticated } from "@/lib/admin-auth";
import { deletePreset, upsertPreset, type PresetInput } from "@/lib/store";

function isValidInput(body: unknown): body is PresetInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    b.name.trim() !== "" &&
    typeof b.description === "string" &&
    typeof b.pan === "number" &&
    typeof b.tilt === "number" &&
    typeof b.zoom === "number"
  );
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!isValidInput(body)) {
    return Response.json({ error: "Dados do preset inválidos." }, { status: 400 });
  }
  try {
    const preset = await upsertPreset(body);
    return Response.json({ ok: true, preset });
  } catch (error) {
    console.error("[api/admin/presets] upsert failed:", error);
    return Response.json({ error: "Falha ao gravar." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  let id = "";
  try {
    const body = await request.json();
    id = typeof body?.id === "string" ? body.id : "";
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!id) return Response.json({ error: "id ausente." }, { status: 400 });
  try {
    await deletePreset(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/presets] delete failed:", error);
    return Response.json({ error: "Falha ao remover." }, { status: 500 });
  }
}
