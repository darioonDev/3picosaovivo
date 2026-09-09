"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FieldView, SectionId } from "@/lib/config/kinds";
import {
  FieldLabel,
  Hint,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from "./field-primitives";
import { ImageField } from "./image-field";

/**
 * Renders one section from its field descriptions and saves just that section.
 * The field list is data produced by the registry, so a new setting appears
 * here without touching this file.
 */
type Value = string | number | boolean | string[];

function initialValues(fields: FieldView[]): Record<string, Value> {
  const out: Record<string, Value> = {};
  for (const f of fields) {
    if (f.kind === "secret") out[f.key] = "";
    else if (Array.isArray(f.value)) out[f.key] = f.value.join("\n");
    else out[f.key] = f.value ?? "";
  }
  return out;
}

export function SectionForm({
  section,
  title,
  blurb,
  fields,
  canUpload,
}: {
  section: SectionId;
  title: string;
  blurb: string;
  fields: FieldView[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const pristine = useMemo(() => initialValues(fields), [fields]);
  const [values, setValues] = useState<Record<string, Value>>(pristine);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = useMemo(
    () => fields.some((f) => values[f.key] !== pristine[f.key]),
    [fields, values, pristine]
  );

  const startsGroup = useMemo(
    () => fields.map((f, i) => Boolean(f.group) && f.group !== fields[i - 1]?.group),
    [fields]
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, values }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: "Configurações salvas." });
        // Re-render from the server so a cleared field visibly falls back to
        // its env var value instead of showing a stale blank.
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

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{blurb}</p>
      </div>

      {fields.map((field, i) => (
        <div key={field.key} className="flex flex-col gap-2">
          {startsGroup[i] && (
            <h3 className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {field.group}
            </h3>
          )}
          <FieldRow
            field={field}
            value={values[field.key]}
            canUpload={canUpload}
            onChange={(v) => {
              setValues((prev) => ({ ...prev, [field.key]: v }));
              setMessage(null);
            }}
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={busy || !dirty}>
          {busy ? "Salvando…" : dirty ? "Salvar" : "Sem alterações"}
        </Button>
        {message && (
          <span
            className={
              message.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"
            }
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

/**
 * Whether blanking this field is even possible. A checkbox or a select always
 * has a value, so telling the operator what "blank" does there is noise.
 */
function canBeBlank(field: FieldView): boolean {
  return !["secret", "boolean", "select"].includes(field.kind);
}

function FieldRow({
  field,
  value,
  onChange,
  canUpload,
}: {
  field: FieldView;
  value: Value;
  onChange: (v: Value) => void;
  canUpload: boolean;
}) {
  const id = `field-${field.key}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
        {field.kind === "secret" && (
          <Badge
            variant="outline"
            className={
              field.isSet
                ? "border-emerald-500/40 text-emerald-400"
                : "border-red-500/40 text-red-400"
            }
          >
            {field.isSet ? "definida" : "não definida"}
          </Badge>
        )}
        {field.fromEnv && field.kind !== "secret" && (
          <Badge variant="outline" className="border-sky-500/40 text-sky-400">
            vindo de {field.env}
          </Badge>
        )}
      </div>

      {field.kind === "image" ? (
        <ImageField
          field={field}
          value={String(value)}
          onChange={onChange}
          canUpload={canUpload}
        />
      ) : field.kind === "boolean" ? (
        <Toggle id={id} checked={value === true} onChange={onChange} />
      ) : field.kind === "select" ? (
        <SelectInput
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectInput>
      ) : field.kind === "number" ? (
        <div className="flex items-center gap-2">
          <TextInput
            id={id}
            type="number"
            inputMode="numeric"
            className="max-w-36"
            value={String(value)}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          {field.unit && (
            <span className="font-mono text-xs text-muted-foreground">
              {field.unit}
            </span>
          )}
        </div>
      ) : field.kind === "list" || field.kind === "textarea" ? (
        <TextArea
          id={id}
          value={String(value)}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <TextInput
          id={id}
          type={field.kind === "secret" ? "password" : "text"}
          autoComplete={field.kind === "secret" ? "new-password" : "off"}
          value={String(value)}
          placeholder={
            field.kind === "secret"
              ? field.isSet
                ? "•••••••• (deixe em branco para manter)"
                : "cole a chave aqui"
              : field.placeholder
          }
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.hint && <Hint>{field.hint}</Hint>}
      {canBeBlank(field) && !field.emptiable && (
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          {field.env
            ? `Em branco: volta a usar a variável ${field.env}.`
            : "Em branco: volta ao valor padrão."}
        </p>
      )}
    </div>
  );
}
