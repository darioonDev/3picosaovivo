import { isAuthenticated } from "@/lib/admin-auth";
import { saveSettings, type SiteSettings } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  let body: Partial<SiteSettings>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  try {
    await saveSettings(body);
  } catch (error) {
    console.error("[api/admin/settings] save failed:", error);
    return Response.json({ error: "Falha ao gravar." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
