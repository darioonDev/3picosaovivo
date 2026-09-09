import "server-only";

import type { FieldKind, SectionId } from "./kinds";

/**
 * The settings registry: one declarative entry per configurable value.
 *
 * This replaces the old three-places-per-field pattern (a SiteConfig key, a
 * STORED_KEYS entry, and a hand-written branch in the settings route). An
 * entry here is enough to make a value resolvable, savable, validatable and
 * renderable in /admin.
 *
 * Twin of camera-24h/lib/config/schema.ts — same machinery, different fields.
 *
 * server-only: FIELDS carries the env var names and the `secret` flags that
 * decide what may reach the browser. Client components import the derived
 * PublicConfig *type* instead — `import type` erases at build time, so it
 * never trips this guard.
 */

interface BaseField<T> {
  section: SectionId;
  /** Optional sub-heading, for grouping fields within one section. */
  group?: string;
  label: string;
  hint?: string;
  placeholder?: string;
  /** Env var consulted when the panel has no stored value. */
  env?: string;
  /** Hardcoded last resort — today's literal value, so defaults change nothing. */
  fallback: T;
  /** Never leaves the server; the form shows "definida"/"não definida". */
  secret?: boolean;
  /** Not a secret, but still irrelevant to the browser (e.g. proxy timeouts). */
  serverOnly?: boolean;
  /**
   * An empty value is meaningful for this field ("hide the footer", "no menu
   * items"), so blank is STORED rather than treated as "clear me and fall
   * back". Without this, blanking a field with a non-empty default silently
   * restores that default — which is right for a field whose blank state is
   * just "unset" (an API key, a YouTube id) and wrong for one the operator is
   * deliberately emptying.
   */
  emptiable?: boolean;
  /**
   * Coerce an unknown value to T, or undefined to reject it. Must tolerate
   * both JSON values (from the settings file) and strings (from env vars).
   */
  parse: (raw: unknown) => T | undefined;
}

export interface TextField extends BaseField<string> {
  kind: Extract<FieldKind, "text" | "textarea" | "secret" | "color" | "image">;
  maxLength?: number;
}
export interface NumberField extends BaseField<number> {
  kind: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}
export interface BooleanField extends BaseField<boolean> {
  kind: "boolean";
}
export interface SelectField<V extends string = string> extends BaseField<V> {
  kind: "select";
  options: readonly { value: V; label: string }[];
}
export interface ListField extends BaseField<string[]> {
  kind: "list";
  /** Allowed values; anything else is dropped on save. */
  catalogue?: readonly string[];
  /** Friendly names for the catalogue, shown as a legend under the field. */
  catalogueLabels?: Readonly<Record<string, string>>;
}

export type Field =
  | TextField
  | NumberField
  | BooleanField
  | SelectField<string>
  | ListField;

// ---- parsers -------------------------------------------------------------
// Each tolerates a raw env string as well as a parsed JSON value. Parsers and
// builders for the other kinds land with the first field that uses them.

const asText = (raw: unknown): string | undefined =>
  typeof raw === "string" ? raw.trim() : undefined;

const asNumber =
  (min?: number, max?: number) =>
  (raw: unknown): number | undefined => {
    const n = typeof raw === "number" ? raw : Number(String(raw).trim());
    if (!Number.isFinite(n)) return undefined;
    if (min !== undefined && n < min) return undefined;
    if (max !== undefined && n > max) return undefined;
    return n;
  };

const asBool = (raw: unknown): boolean | undefined => {
  if (typeof raw === "boolean") return raw;
  const v = String(raw).trim().toLowerCase();
  if (["1", "true", "yes", "sim", "on"].includes(v)) return true;
  if (["0", "false", "no", "nao", "n\u00e3o", "off"].includes(v)) return false;
  return undefined;
};

/** Accepts a JSON array, or a newline/comma separated string from an env var. */
const asList = (raw: unknown): string[] | undefined => {
  const parts = Array.isArray(raw)
    ? raw.map((v) => (typeof v === "string" ? v : String(v)))
    : typeof raw === "string"
      ? raw.split(/[\n,]/)
      : undefined;
  if (parts === undefined) return undefined;
  return parts.map((v) => v.trim()).filter((v) => v !== "");
};

// ---- builders ------------------------------------------------------------
// These exist so `fallback` keeps its wide type (string, not the literal
// "INOVAF30") while select fields still narrow to their option union.

/**
 * Plain string field. `kind` defaults to "text" but may be narrowed to another
 * string-valued kind ("textarea", "image") that shares the same parser.
 */
const text = (
  d: Omit<TextField, "kind" | "parse"> & { kind?: TextField["kind"] }
): TextField => ({
  kind: "text",
  parse: asText,
  ...d,
});

const number = (d: Omit<NumberField, "kind" | "parse">): NumberField => ({
  kind: "number",
  parse: asNumber(d.min, d.max),
  ...d,
});

const secret = (d: Omit<TextField, "kind" | "parse" | "secret">): TextField => ({
  kind: "secret",
  secret: true,
  parse: asText,
  ...d,
});

const bool = (d: Omit<BooleanField, "kind" | "parse">): BooleanField => ({
  kind: "boolean",
  parse: asBool,
  ...d,
});

const list = (d: Omit<ListField, "kind" | "parse">): ListField => ({
  kind: "list",
  // A catalogue restricts the list to known ids and preserves the chosen
  // order, so a stale or hand-edited settings file cannot inject unknowns.
  parse: d.catalogue
    ? (raw) => asList(raw)?.filter((v) => d.catalogue!.includes(v))
    : asList,
  ...d,
});

// ---- the registry --------------------------------------------------------
//
// The six keys the previous SiteSettings interface used (siteName, tagline,
// locationLabel, cameraName, cameraResolution, updateIntervalSeconds) are kept
// verbatim so an olhar-data.json written before this change still loads.

export const FIELDS = {
  // --- Câmera ---
  cameraName: text({
    section: "camera",
    label: "Nome da câmera",
    fallback: "Câmera PTZ — Mascarin",
  }),
  cameraResolution: text({
    section: "camera",
    label: "Resolução informada",
    hint: "Texto livre, exibido junto ao player.",
    fallback: "1920×1080",
  }),
  hlsUrl: text({
    section: "camera",
    label: "Manifesto HLS (.m3u8)",
    hint:
      "Caminho que o navegador toca. Use o proxy same-origin /live para evitar " +
      "conteúdo misto quando o gateway responde em http://.",
    placeholder: "/live/stream.m3u8",
    env: "HLS_URL",
    fallback: "/live/stream.m3u8",
  }),
  hlsUpstream: text({
    section: "camera",
    label: "Gateway RTSP→HLS",
    hint:
      "URL base que a rota /live busca no servidor. Pode ser http:// mesmo com " +
      "o site em https://. Vazio desativa o proxy.",
    placeholder: "http://177.7.39.222:8888",
    env: "HLS_UPSTREAM",
    // Preserves the default this app already shipped with, so an unset env var
    // keeps streaming exactly as before.
    fallback: "http://177.7.39.222:8888",
    serverOnly: true,
  }),
  playerAutoplay: bool({
    section: "camera",
    group: "Player",
    label: "Iniciar automaticamente",
    fallback: true,
  }),
  playerMuted: bool({
    section: "camera",
    group: "Player",
    label: "Começar sem som",
    hint: "Navegadores só permitem autoplay com o som desligado.",
    fallback: true,
  }),
  playerControls: bool({
    section: "camera",
    group: "Player",
    label: "Mostrar controles",
    fallback: true,
  }),

  // --- Estação ---
  wuApiKey: secret({
    section: "station",
    label: "Chave da API (Weather Underground)",
    hint:
      "Opcional: sem chave, o app usa a chave pública do dashboard do WU e os " +
      "dados ao vivo continuam carregando. Defina a sua só para ter limites " +
      "melhores. Nunca é exibida de volta.",
    env: "WU_API_KEY",
    fallback: "",
  }),
  wuStationId: text({
    section: "station",
    label: "ID da estação PWS",
    placeholder: "INOVAF30",
    env: "WU_STATION_ID",
    fallback: "INOVAF30",
  }),
  updateIntervalSeconds: number({
    section: "station",
    label: "Intervalo de atualização",
    hint: "Cadência com que o dashboard busca novas leituras.",
    env: "WEATHER_REFRESH_SECONDS",
    fallback: 60,
    min: 30,
    max: 3600,
    step: 30,
    unit: "s",
  }),

  // --- Identidade ---
  siteName: text({
    section: "identity",
    label: "Nome do site",
    fallback: "Olhar dos Três Picos",
  }),
  tagline: text({
    section: "identity",
    label: "Linha de apoio",
    emptiable: true,
    fallback: "Monitoramento visual e meteorológico das montanhas",
  }),
  locationLabel: text({
    section: "identity",
    label: "Local",
    fallback: "Mascarin • Nova Friburgo • RJ",
  }),
  headerEyebrow: text({
    section: "identity",
    label: "Texto acima do título",
    emptiable: true,
    fallback: "Centro de monitoramento",
  }),
  logoUrl: text({
    section: "identity",
    kind: "image",
    label: "Logotipo",
    hint: "Exibido no cabeçalho. Vazio mostra só o texto.",
    emptiable: true,
    fallback: "",
  }),
  navItems: list({
    section: "identity",
    label: "Itens do menu",
    hint: "Um por linha, no formato Rótulo|/caminho. Vazio oculta o menu.",
    emptiable: true,
    fallback: [
      "Ao vivo|/",
      "Histórico|/historico",
      "Picos|/picos",
      "Timelapse|/timelapse",
    ],
  }),
  seoTitle: text({
    section: "identity",
    group: "SEO",
    label: "Título da página",
    fallback: "Olhar dos Três Picos",
  }),
  seoDescription: text({
    section: "identity",
    group: "SEO",
    kind: "textarea",
    label: "Descrição da página",
    fallback: "Monitoramento visual e meteorológico das montanhas",
  }),

  // --- Segurança ---
  adminSessionDays: number({
    section: "security",
    label: "Duração da sessão do painel",
    hint: "Vale para sessões novas; a atual mantém o prazo com que foi criada.",
    fallback: 7,
    min: 1,
    max: 90,
    step: 1,
    unit: "dias",
    serverOnly: true,
  }),
} satisfies Record<string, Field>;

export type FieldKey = keyof typeof FIELDS;

/** The resolved value type of one field entry. */
type ValueOf<F> = F extends { fallback: infer T } ? T : never;

/** Every setting, fully resolved (panel → env → fallback). */
export type SiteConfig = { [K in FieldKey]: ValueOf<(typeof FIELDS)[K]> };

/** Keys safe to ship to the browser — derived, so a new secret is excluded by construction. */
export type PublicKey = {
  [K in FieldKey]: (typeof FIELDS)[K] extends { secret: true } | { serverOnly: true }
    ? never
    : K;
}[FieldKey];

export type PublicConfig = Pick<SiteConfig, PublicKey>;

export const FIELD_ENTRIES = Object.entries(FIELDS) as [FieldKey, Field][];

export function isPublicField(field: Field): boolean {
  return !field.secret && !field.serverOnly;
}
