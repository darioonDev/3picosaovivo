"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CameraPreset } from "@/providers/camera/camera-provider";
import { FieldLabel, TextInput } from "./field-primitives";

/**
 * CRUD for the camera presets. The API (POST/DELETE /api/admin/presets) and
 * the store have existed since the project was scaffolded; this is the screen
 * that finally reaches them. Presets are the source of truth for the dashboard
 * and /picos, so an edit here changes both.
 */
type Draft = { id?: string; name: string; description: string; pan: string; tilt: string; zoom: string };

const EMPTY: Draft = { name: "", description: "", pan: "0", tilt: "0", zoom: "1" };

export function PresetsPanel({ presets }: { presets: CameraPreset[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const editing = draft.id !== undefined;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          name: draft.name,
          description: draft.description,
          // The API requires numbers; the inputs hold strings while typing.
          pan: Number(draft.pan),
          tilt: Number(draft.tilt),
          zoom: Number(draft.zoom),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDraft(EMPTY);
        setMessage({ ok: true, text: editing ? "Preset atualizado." : "Preset criado." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: data.error ?? "Falha ao salvar." });
      }
    } catch {
      setMessage({ ok: false, text: "Falha de conexão." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(preset: CameraPreset) {
    if (!window.confirm(`Excluir o preset "${preset.name}"?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/presets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id }),
      });
      if (res.ok) {
        if (draft.id === preset.id) setDraft(EMPTY);
        setMessage({ ok: true, text: "Preset excluído." });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ ok: false, text: data.error ?? "Falha ao excluir." });
      }
    } catch {
      setMessage({ ok: false, text: "Falha de conexão." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div>
        <h3 className="text-sm font-semibold">Presets da câmera</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Aparecem no seletor da home e na página /picos. O movimento em si
          ainda é simulado — não há PTZ conectada.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {presets.length === 0 && (
          <li className="text-xs text-muted-foreground">Nenhum preset cadastrado.</li>
        )}
        {presets.map((preset) => (
          <li
            key={preset.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{preset.name}</span>
                {preset.status === "active" && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                    ativo
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {preset.description || "sem descrição"}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/70">
                pan {preset.position.pan} · tilt {preset.position.tilt} · zoom{" "}
                {preset.position.zoom}x
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  setDraft({
                    id: preset.id,
                    name: preset.name,
                    description: preset.description,
                    pan: String(preset.position.pan),
                    tilt: String(preset.position.tilt),
                    zoom: String(preset.position.zoom),
                  })
                }
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                disabled={busy}
                onClick={() => remove(preset)}
              >
                Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={save} className="flex flex-col gap-3 rounded-md border border-border p-3">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {editing ? `Editando: ${draft.name || draft.id}` : "Novo preset"}
        </h4>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="preset-name">Nome</FieldLabel>
          <TextInput
            id="preset-name"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="preset-desc">Descrição</FieldLabel>
          <TextInput
            id="preset-desc"
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["pan", "Pan (°)", -180, 180],
              ["tilt", "Tilt (°)", -90, 90],
              ["zoom", "Zoom (x)", 1, 30],
            ] as const
          ).map(([key, label, min, max]) => (
            <div key={key} className="flex flex-col gap-2">
              <FieldLabel htmlFor={`preset-${key}`}>{label}</FieldLabel>
              <TextInput
                id={`preset-${key}`}
                type="number"
                min={min}
                max={max}
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || draft.name.trim() === ""}>
            {busy ? "Salvando…" : editing ? "Atualizar preset" : "Criar preset"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraft(EMPTY)}
            >
              Cancelar edição
            </Button>
          )}
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
