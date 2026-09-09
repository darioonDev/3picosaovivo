/**
 * Field kinds and section ids for the settings registry.
 *
 * Deliberately NOT "server-only": the admin form components need these types
 * and the section list at runtime. Nothing here touches the filesystem or
 * reads a secret — the registry itself (schema.ts) is the server-only half.
 *
 * Twin of camera-24h/lib/config/kinds.ts. The two apps are separate repos
 * deployed by `git archive`, so a shared package would not survive the build;
 * they are kept structurally identical instead, on purpose.
 */

/** Left-hand menu of /admin. Every field declares which one it belongs to. */
export type SectionId = "camera" | "station" | "identity" | "security";

export const SECTIONS: readonly { id: SectionId; label: string; blurb: string }[] = [
  { id: "camera", label: "Câmera", blurb: "Transmissão ao vivo e presets" },
  { id: "station", label: "Estação", blurb: "Weather Underground e leituras" },
  { id: "identity", label: "Identidade", blurb: "Marca, textos e SEO" },
  { id: "security", label: "Segurança", blurb: "Senha, backup e diagnóstico" },
];

/** How the admin panel renders a field, and what shape its value has. */
export type FieldKind =
  | "text"
  | "textarea"
  | "secret"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "image"
  | "list";

/**
 * The serialisable description of one field that crosses to the client so the
 * form can render it. Secrets send `isSet` instead of `value` — the value
 * itself never leaves the server.
 */
export interface FieldView {
  key: string;
  kind: FieldKind;
  section: SectionId;
  group?: string;
  label: string;
  hint?: string;
  placeholder?: string;
  /** Name of the env var consulted when the panel has no value. */
  env?: string;
  options?: readonly { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Absent for secrets. */
  value?: string | number | boolean | string[];
  /** Only for secrets: whether a value is currently stored. */
  isSet?: boolean;
  /** True when the live value comes from the env var, not the panel. */
  fromEnv?: boolean;
  /** True when blanking the field stores an empty value instead of resetting it. */
  emptiable?: boolean;
  /** For list fields: the accepted values and their friendly names. */
  catalogue?: readonly { value: string; label: string }[];
}
