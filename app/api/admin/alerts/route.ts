import { isAuthenticated } from "@/lib/admin-auth";
import {
  addAlert,
  deleteAlert,
  getAlerts,
  setAlertAcknowledged,
  type AlertSeverity,
} from "@/lib/store";

/**
 * Alert CRUD. lib/store.ts has implemented addAlert / setAlertAcknowledged /
 * deleteAlert since the project was scaffolded, but no route ever exposed
 * them — this closes the gap noted in docs/PLANEJAMENTO.md.
 */
const SEVERITIES: AlertSeverity[] = ["info", "warning", "critical"];

function isSeverity(v: unknown): v is AlertSeverity {
  return typeof v === "string" && SEVERITIES.includes(v as AlertSeverity);
}

async function guard(): Promise<Response | null> {
  return (await isAuthenticated())
    ? null
    : Response.json({ error: "Não autorizado." }, { status: 401 });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return Response.json({ alerts: await getAlerts() });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title === "") {
    return Response.json({ error: "Informe um título." }, { status: 400 });
  }
  if (!isSeverity(body.severity)) {
    return Response.json(
      { error: `Severidade inválida. Use: ${SEVERITIES.join(", ")}.` },
      { status: 400 }
    );
  }

  const alert = await addAlert({
    severity: body.severity,
    title,
    description: typeof body.description === "string" ? body.description : "",
  });
  return Response.json({ ok: true, alert });
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return Response.json({ error: "Informe o id." }, { status: 400 });

  await setAlertAcknowledged(id, body.acknowledged !== false);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return Response.json({ error: "Informe o id." }, { status: 400 });

  await deleteAlert(id);
  return Response.json({ ok: true });
}
