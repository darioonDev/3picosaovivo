"use client";

import { cn } from "@/lib/utils";

/**
 * Minimal form primitives in the repo's Tailwind idiom.
 *
 * Deliberately hand-written rather than pulled in with `shadcn add`: the panel
 * needs four plain controls, while the generator would add a dependency on
 * Base UI's form stack (and its render-prop API differs from the Radix-era
 * examples), for markup that is a few lines here.
 */
const base =
  "w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm " +
  "text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 " +
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

export function TextInput(props: React.ComponentProps<"input">) {
  return <input {...props} className={cn(base, props.className)} />;
}

export function TextArea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={cn(base, "min-h-24 resize-y", props.className)} />
  );
}

export function SelectInput(props: React.ComponentProps<"select">) {
  return <select {...props} className={cn(base, "cursor-pointer", props.className)} />;
}

export function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-pointer accent-primary"
      />
      <span className="font-mono text-xs text-muted-foreground">
        {checked ? "Ativado" : "Desativado"}
      </span>
    </label>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </label>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>;
}
