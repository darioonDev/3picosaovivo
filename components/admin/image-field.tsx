"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FieldView } from "@/lib/config/kinds";
import { TextInput } from "./field-primitives";

/**
 * URL box + upload button + preview. The URL stays editable so the field still
 * works when the uploads directory is read-only. Uploading writes the file and
 * saves the field immediately — it is a file operation, not part of the
 * form's patch.
 */
export function ImageField({
  field,
  value,
  onChange,
  canUpload,
}: {
  field: FieldView;
  value: string;
  onChange: (v: string) => void;
  canUpload: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("field", field.key);
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onChange(data.url);
      else setError(data.error ?? "Falha no envio.");
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {value && (
          <span className="grid size-10 flex-none place-items-center overflow-hidden rounded-md border border-border bg-muted">
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          </span>
        )}
        <TextInput
          id={`field-${field.key}`}
          type="text"
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || !canUpload}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Enviando…" : "Enviar imagem"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={upload}
        />
        {value !== "" && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => onChange("")}
          >
            remover
          </button>
        )}
      </div>

      {!canUpload && (
        <p className="text-[11px] text-muted-foreground/70">
          A pasta de uploads não é gravável no servidor, então o envio está
          desativado — informe a imagem por URL.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
