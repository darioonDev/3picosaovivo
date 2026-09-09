"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextInput } from "./field-primitives";

interface Diagnostics {
  settingsPath: string;
  exists: boolean;
  bytes: number;
  writable: boolean;
  overridden: string[];
}

type Msg = { ok: boolean; text: string } | null;

/**
 * Password change plus the maintenance actions (backup, restore, reset,
 * diagnostics). These are operations rather than settings, so they live
 * beside the generic section form instead of inside it.
 */
export function SecurityPanel({
  hasStoredPassword,
  envFallbackActive,
  minLength,
}: {
  hasStoredPassword: boolean;
  envFallbackActive: boolean;
  minLength: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [maintMsg, setMaintMsg] = useState<Msg>(null);
  const [maintBusy, setMaintBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setPwMsg({ ok: false, text: "A confirmação não confere." });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCurrent("");
        setNext("");
        setConfirm("");
        setPwMsg({
          ok: true,
          text: "Senha alterada. As sessões abertas em outros navegadores caíram.",
        });
        router.refresh();
      } else {
        setPwMsg({ ok: false, text: data.error ?? "Falha ao alterar a senha." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Falha de conexão." });
    } finally {
      setPwBusy(false);
    }
  }

  async function loadDiagnostics() {
    setMaintBusy(true);
    setMaintMsg(null);
    try {
      const res = await fetch("/api/admin/maintenance");
      const data = await res.json();
      if (res.ok) setDiag(data.diagnostics);
      else setMaintMsg({ ok: false, text: data.error ?? "Falha ao consultar." });
    } catch {
      setMaintMsg({ ok: false, text: "Falha de conexão." });
    } finally {
      setMaintBusy(false);
    }
  }

  async function backup() {
    setMaintBusy(true);
    setMaintMsg(null);
    try {
      const res = await fetch("/api/admin/maintenance");
      const data = await res.json();
      if (!res.ok) {
        setMaintMsg({ ok: false, text: data.error ?? "Falha ao exportar." });
        return;
      }
      const blob = new Blob([JSON.stringify(data.settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `olhar-config-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMaintMsg({
        ok: true,
        text: "Backup baixado. Chaves secretas não são incluídas.",
      });
    } catch {
      setMaintMsg({ ok: false, text: "Falha de conexão." });
    } finally {
      setMaintBusy(false);
    }
  }

  async function post(action: string, extra: Record<string, unknown> = {}) {
    setMaintBusy(true);
    setMaintMsg(null);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMaintMsg({
          ok: true,
          text:
            action === "reset"
              ? "Configurações restauradas para os padrões."
              : `Importado: ${data.saved?.length ?? 0} campo(s).`,
        });
        router.refresh();
      } else {
        setMaintMsg({ ok: false, text: data.error ?? "Falha na operação." });
      }
    } catch {
      setMaintMsg({ ok: false, text: "Falha de conexão." });
    } finally {
      setMaintBusy(false);
    }
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const settings = JSON.parse(await file.text());
      await post("import", { settings });
    } catch {
      setMaintMsg({ ok: false, text: "Arquivo não é um JSON válido." });
    }
  }

  return (
    <>
      <h3 className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Senha do painel</h3>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {hasStoredPassword
          ? "Uma senha definida pelo painel está em uso."
          : "Nenhuma senha definida pelo painel — o acesso usa a variável de ambiente."}
        {envFallbackActive && (
          <>
            {" "}
            A variável <code>ADMIN_PASSWORD</code> continua valendo como acesso de
            emergência. Remova-a no painel da Hostinger depois de definir a senha
            aqui, ou mantenha-a como plano B.
          </>
        )}
      </p>

      <form onSubmit={changePassword}>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pw-current">
            Senha atual
          </FieldLabel>
          <TextInput
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pw-next">
            Nova senha
          </FieldLabel>
          <TextInput
            id="pw-next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">Mínimo de {minLength} caracteres.</span>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pw-confirm">
            Confirme a nova senha
          </FieldLabel>
          <TextInput
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pwBusy || !current || !next}>
            {pwBusy ? "Alterando…" : "Alterar senha"}
          </Button>
        </div>
        {pwMsg && (
          <p className={pwMsg.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
            {pwMsg.text}
          </p>
        )}
      </form>

      <h3 className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Backup e manutenção</h3>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={backup}
          disabled={maintBusy}
        >
          Baixar backup
        </Button>
        <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">
          Restaurar backup
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImportFile}
          />
        </label>
        <Button
          variant="outline"
          type="button"
          onClick={loadDiagnostics}
          disabled={maintBusy}
        >
          Diagnóstico
        </Button>
        <Button
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          type="button"
          disabled={maintBusy}
          onClick={() => {
            if (
              window.confirm(
                "Restaurar TODAS as configurações para os padrões? As variáveis de ambiente voltam a valer. A senha do painel não é afetada."
              )
            ) {
              post("reset");
            }
          }}
        >
          Restaurar padrões
        </Button>
      </div>

      {maintMsg && (
        <p className={maintMsg.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
          {maintMsg.text}
        </p>
      )}

      {diag && (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <dt className="text-muted-foreground">Arquivo</dt>
          <dd className="m-0">
            <code>{diag.settingsPath}</code>
          </dd>
          <dt className="text-muted-foreground">Existe</dt>
          <dd className="m-0">{diag.exists ? `sim (${diag.bytes} bytes)` : "ainda não gravado"}</dd>
          <dt className="text-muted-foreground">Gravável</dt>
          <dd className={diag.writable ? "m-0 text-emerald-400" : "m-0 text-red-400"}>
            {diag.writable ? "sim" : "NÃO — o painel não conseguirá salvar"}
          </dd>
          <dt className="text-muted-foreground">Definidos no painel</dt>
          <dd className="m-0">
            {diag.overridden.length > 0
              ? `${diag.overridden.length} campo(s)`
              : "nenhum (tudo em env ou padrão)"}
          </dd>
        </dl>
      )}
    </>
  );
}
