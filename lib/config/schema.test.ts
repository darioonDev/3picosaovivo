import { describe, expect, it } from "vitest";
import { FIELDS, FIELD_ENTRIES, isPublicField, type Field } from "./schema";
import { SECTIONS } from "./kinds";

/**
 * Guard rails for the settings registry.
 *
 * The important one is the secret projection: `getPublicConfig` filters on the
 * `secret`/`serverOnly` flags, so a field marked wrong would ship a credential
 * to the browser. The build only catches the coarser mistake of importing a
 * server-only module from a client component — nothing else would notice this.
 */
describe("settings registry", () => {
  it("keeps every credential out of the public projection", () => {
    const leaked = FIELD_ENTRIES.filter(
      ([, field]) => isPublicField(field) && (field.secret || field.serverOnly)
    ).map(([key]) => key);

    expect(leaked).toEqual([]);
  });

  it("marks credential-shaped fields as secret", () => {
    // A field whose name suggests a credential must never be public. This
    // catches the realistic mistake: adding an api key and forgetting the flag.
    const suspicious = FIELD_ENTRIES.filter(([key]) =>
      /key|secret|password|token/i.test(key)
    );

    expect(suspicious.length).toBeGreaterThan(0);
    for (const [key, field] of suspicious) {
      expect(field.secret, `${key} deve ser secret`).toBe(true);
    }
  });

  it("declares every field in a known section", () => {
    const known = new Set(SECTIONS.map((s) => s.id));
    for (const [key, field] of FIELD_ENTRIES) {
      expect(known.has(field.section), `${key} usa seção desconhecida`).toBe(true);
    }
  });

  it("parses each field's own fallback back to itself", () => {
    // A fallback the field's parser rejects would silently resolve to
    // undefined at runtime, which is the kind of thing nothing else catches.
    for (const [key, field] of FIELD_ENTRIES) {
      const f = field as Field;
      const parsed = f.parse(f.fallback);
      expect(parsed, `fallback de ${key} não passa no próprio parser`).toEqual(
        f.fallback
      );
    }
  });

  it("gives select fields a fallback that is one of their options", () => {
    for (const [key, field] of FIELD_ENTRIES) {
      if (field.kind !== "select") continue;
      const values = field.options.map((o) => o.value);
      expect(values, `${key} tem fallback fora das opções`).toContain(field.fallback);
    }
  });

  it("keeps number fallbacks inside their own range", () => {
    for (const [key, field] of FIELD_ENTRIES) {
      if (field.kind !== "number") continue;
      if (field.min !== undefined) {
        expect(field.fallback, `${key} abaixo do mínimo`).toBeGreaterThanOrEqual(field.min);
      }
      if (field.max !== undefined) {
        expect(field.fallback, `${key} acima do máximo`).toBeLessThanOrEqual(field.max);
      }
    }
  });

  it("has no duplicate env var names", () => {
    const envs = FIELD_ENTRIES.map(([, f]) => f.env).filter(
      (e): e is string => e !== undefined
    );
    expect(new Set(envs).size).toBe(envs.length);
  });

  it("exposes at least one field, so the panel is never empty", () => {
    expect(Object.keys(FIELDS).length).toBeGreaterThan(0);
  });
});
