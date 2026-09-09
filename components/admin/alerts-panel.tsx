"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlertSeverity, WeatherAlert } from "@/lib/store";
import { FieldLabel, SelectInput, TextArea, TextInput } from "./field-primitives";

/**
 * Weather alert management. lib/store.ts has had addAlert /
 * setAlertAcknowledged / deleteAlert since the project was scaffolded, with no
 * route and no screen reaching them; this closes that gap.
 */
const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  info: "border-sky-500/40 text-sky-400",
  warning: "border-amber-500/40 text-amber-400",
  critical: "border-red-500/40 text-red-400",
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Informativo",
  warning: "Atenção",
  critical: "Crítico",
};

export function AlertsPanel({ alerts }: { alerts: WeatherAlert[] }) {
  const router = useRouter();
  const [severity, setSeverity] = useState<AlertSeverity>("warning");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(init: RequestInit, okText: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/alerts", {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: okText });
        router.refresh();
        return true;
      }
      setMessage({ ok: false, text: data.error ?? "Falha na operação." });
    } catch {
      setMessage({ ok: false, text: "Falha de conexão." });
    } finally {
      setBusy(false);
    }
    return false;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call(
      { method: "POST", body: JSON.stringify({ severity, title, description }) },
      "Alerta publicado."
    );
    if (ok) {
      setTitle("");
      setDescription("");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-semibold tracking-tight">Alertas</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Avisos meteorológicos publicados para a equipe. Reconhecer um alerta o
          marca como visto sem apagá-lo do histórico.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {alerts.length === 0 && (
          <li className="text-xs text-muted-foreground">Nenhum alerta registrado.</li>
        )}
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={SEVERITY_STYLE[alert.severity]}>
                  {SEVERITY_LABEL[alert.severity]}
                </Badge>
                <span className="text-sm font-medium">{alert.title}</span>
                {alert.acknowledged && (
                  <Badge variant="outline" className="text-muted-foreground">
                    reconhecido
                  </Badge>
                )}
              </div>
              {alert.description && (
                <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
              )}
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
                {new Date(alert.createdAt).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  call(
                    {
                      method: "PATCH",
                      body: JSON.stringify({
                        id: alert.id,
                        acknowledged: !alert.acknowledged,
                      }),
                    },
                    alert.acknowledged ? "Alerta reaberto." : "Alerta reconhecido."
                  )
                }
              >
                {alert.acknowledged ? "Reabrir" : "Reconhecer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Excluir o alerta "${alert.title}"?`)) {
                    call(
                      { method: "DELETE", body: JSON.stringify({ id: alert.id }) },
                      "Alerta excluído."
                    );
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="flex flex-col gap-3 rounded-md border border-border p-3">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Novo alerta
        </h4>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="alert-severity">Severidade</FieldLabel>
          <SelectInput
            id="alert-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
          >
            {(Object.keys(SEVERITY_LABEL) as AlertSeverity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABEL[s]}
              </option>
            ))}
          </SelectInput>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="alert-title">Título</FieldLabel>
          <TextInput
            id="alert-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="alert-desc">Descrição</FieldLabel>
          <TextArea
            id="alert-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || title.trim() === ""}>
            {busy ? "Publicando…" : "Publicar alerta"}
          </Button>
          {message && (
            <span className={message.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
