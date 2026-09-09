import { isAuthenticated } from "@/lib/admin-auth";
import { getSiteConfig, saveSiteConfig } from "@/lib/config/resolve";
import { FIELDS } from "@/lib/config/schema";
import {
  deleteAsset,
  MAX_UPLOAD_BYTES,
  saveUpload,
  sniffExtension,
} from "@/lib/uploads";

/** Upload an image for one `image` field and point that field at it. */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Reject on the declared size before buffering the body.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 4096) {
    return Response.json(
      { error: `Arquivo muito grande (máximo ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).` },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // The target must be a real image field — the client cannot invent a slot.
  const fieldKey = String(form.get("field") ?? "");
  const field = (FIELDS as Record<string, { kind: string }>)[fieldKey];
  if (!field || field.kind !== "image") {
    return Response.json({ error: "Campo de imagem inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Re-check the real length: the declared size can lie.
  if (buf.byteLength > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `Arquivo muito grande (máximo ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).` },
      { status: 413 }
    );
  }

  // Trust the bytes, not the Content-Type the browser attached.
  const ext = sniffExtension(buf);
  if (!ext) {
    return Response.json(
      { error: "Formato não suportado. Envie PNG, JPEG ou WebP." },
      { status: 415 }
    );
  }

  const previous = (await getSiteConfig())[fieldKey as keyof Awaited<
    ReturnType<typeof getSiteConfig>
  >];

  let url: string;
  try {
    url = await saveUpload(fieldKey, buf, ext);
    await saveSiteConfig({ [fieldKey]: url });
  } catch (error) {
    console.error("[api/admin/upload] failed:", error);
    return Response.json(
      {
        error:
          "Não foi possível gravar o arquivo no servidor. Verifique se a pasta " +
          "de uploads é gravável, ou informe a imagem por URL.",
      },
      { status: 503 }
    );
  }

  // Best effort: drop the file this one replaced so uploads don't pile up.
  if (typeof previous === "string" && previous !== url) {
    await deleteAsset(previous);
  }

  return Response.json({ ok: true, url });
}
