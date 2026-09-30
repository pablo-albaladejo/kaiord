/**
 * Extracts chat/text model ids from the installed `@ai-sdk/*` type unions and
 * renders the runtime model catalog consumed via `@kaiord/ai/providers`.
 * Sourcing from the pinned SDK means model lists track `@ai-sdk/*` bumps
 * instead of a hand-maintained enum. A free-text field in the UI covers ids
 * newer than the pin.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const requireFrom = createRequire(import.meta.url);

/**
 * Per-provider: which union to read and which non-text ids to drop. `union`
 * accepts a single name or a new-then-legacy list so the extractor tolerates
 * the union renames that `@ai-sdk/*` ships on major bumps (v4 renamed
 * `AnthropicMessagesModelId`/`GoogleGenerativeAIModelId`).
 *
 * The SDK unions keep ids the provider no longer serves. `retired` maps each
 * id the provider answers 404 for to its same-tier successor: the id is
 * dropped from the catalog AND emitted as `RETIRED_MODELS` so saved choices
 * heal to the successor at resolution time. `deprecated` ids still answer but
 * are announced for retirement (`retiresOn` is null while the provider has
 * not dated it): they are dropped from the catalog and emitted as
 * `DEPRECATED_MODELS` so the UI can warn. Every successor must be in the
 * catalog, or extraction throws.
 *
 * Only Anthropic's lists are curated, from
 * platform.claude.com/docs/en/about-claude/model-deprecations. OpenAI and
 * Google carry none: their SDK unions are taken as served, and a stale id
 * there surfaces as a model-not-found error at call time.
 */
export const SOURCES = {
  anthropic: {
    pkg: "@ai-sdk/anthropic",
    union: ["AnthropicModelId", "AnthropicMessagesModelId"],
    retired: {
      "claude-3-haiku-20240307": "claude-haiku-4-5",
      "claude-opus-4-1": "claude-opus-5",
      "claude-opus-4-1-20250805": "claude-opus-5",
    },
    deprecated: {
      "claude-opus-4-0": { successor: "claude-opus-5", retiresOn: null },
      "claude-opus-4-20250514": { successor: "claude-opus-5", retiresOn: null },
      "claude-sonnet-4-0": { successor: "claude-sonnet-5", retiresOn: null },
      "claude-sonnet-4-20250514": {
        successor: "claude-sonnet-5",
        retiresOn: null,
      },
    },
  },
  openai: {
    pkg: "@ai-sdk/openai",
    union: "OpenAIChatModelId",
    exclude:
      /(audio|search-preview|transcribe|tts|image|embedding|moderation|realtime)/,
  },
  google: {
    pkg: "@ai-sdk/google",
    union: ["GoogleModelId", "GoogleGenerativeAIModelId"],
    exclude:
      /(image|tts|audio|computer-use|robotics|embedding|imagen|veo|lyria|nano-banana|deep-research)/,
  },
};

/** Single-quoted literals of `type <unionName> = ...;`, or null if absent. */
const matchUnion = (dtsText, unionName) => {
  const match = new RegExp(`type ${unionName}\\s*=([^;]*);`).exec(dtsText);
  return match ? [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : null;
};

/** Extract single-quoted literals from `type <unionName> = '...' | ...;`. */
export const parseModelIds = (dtsText, unionName) => {
  const ids = matchUnion(dtsText, unionName);
  if (!ids) throw new Error(`union ${unionName} not found`);
  return ids;
};

/** Ids of one provider type that must never be offered. */
const unavailableIds = (type) =>
  new Set([
    ...Object.keys(SOURCES[type].retired ?? {}),
    ...Object.keys(SOURCES[type].deprecated ?? {}),
  ]);

/** Parsed chat ids for one provider type, minus non-text and retiring ids. */
export const chatModelIds = (type, dtsText) => {
  const { union, exclude } = SOURCES[type];
  const names = Array.isArray(union) ? union : [union];
  const ids = names.map((n) => matchUnion(dtsText, n)).find((v) => v !== null);
  if (!ids) throw new Error(`union not found: ${names.join(" | ")}`);
  const unavailable = unavailableIds(type);
  return ids.filter(
    (id) => !(exclude && exclude.test(id)) && !unavailable.has(id)
  );
};

/** Retired id -> successor per provider type (the provider answers 404). */
export const retiredModels = () =>
  Object.fromEntries(
    Object.keys(SOURCES).map((type) => [type, SOURCES[type].retired ?? {}])
  );

/** Deprecated id -> { successor, retiresOn } per provider type. */
export const deprecatedModels = () =>
  Object.fromEntries(
    Object.keys(SOURCES).map((type) => [type, SOURCES[type].deprecated ?? {}])
  );

/** Throw unless every retired/deprecated successor is offered by `catalog`. */
export const assertSuccessorsInCatalog = (
  catalog,
  retired = retiredModels(),
  deprecated = deprecatedModels()
) => {
  for (const type of Object.keys(catalog)) {
    const offered = new Set(catalog[type].map((o) => o.id));
    const successors = [
      ...Object.values(retired[type] ?? {}),
      ...Object.values(deprecated[type] ?? {}).map((d) => d.successor),
    ];
    const missing = successors.filter((id) => !offered.has(id));
    if (missing.length > 0) {
      throw new Error(`${type} successors not in catalog: ${missing.join()}`);
    }
  }
};

const readSdkDts = (pkg) =>
  readFileSync(
    join(
      dirname(requireFrom.resolve(`${pkg}/package.json`)),
      "dist",
      "index.d.ts"
    ),
    "utf8"
  );

/** Build the full catalog by reading each installed SDK package. */
export const extractCatalog = () => {
  const catalog = {};
  for (const type of Object.keys(SOURCES)) {
    catalog[type] = chatModelIds(type, readSdkDts(SOURCES[type].pkg)).map(
      (id) => ({ id, label: id })
    );
  }
  assertSuccessorsInCatalog(catalog);
  return catalog;
};

const TYPES = ["anthropic", "openai", "google"];

const renderEntries = (options) =>
  options
    .map(
      (o) =>
        `    { id: ${JSON.stringify(o.id)}, label: ${JSON.stringify(o.label)} },`
    )
    .join("\n");

const renderMap = (map, renderValue) => {
  const entries = Object.entries(map);
  return entries.length === 0
    ? "{}"
    : `{\n${entries
        .map(([id, v]) => `    ${JSON.stringify(id)}: ${renderValue(v)},`)
        .join("\n")}\n  }`;
};

const renderDeprecation = (d) =>
  `{ successor: ${JSON.stringify(d.successor)}, retiresOn: ${JSON.stringify(d.retiresOn)} }`;

/** Render the generated TS module text (must match committed bytes). */
export const renderCatalogModule = (
  catalog,
  retired = retiredModels(),
  deprecated = deprecatedModels()
) =>
  `// AUTO-GENERATED by scripts/generate-model-catalog.mjs — DO NOT EDIT.
// Sourced from the installed @ai-sdk/* model-id type unions, filtered to
// chat/text models minus the retired/deprecated ids listed in the script.
// Regenerate with \`pnpm generate:model-catalog\` after bumping @ai-sdk/*.
// A free-text field in the UI covers ids newer than the pin.
import type { LlmProviderType, ModelDeprecation, ModelOption } from "../types";

export const MODEL_CATALOG: Record<LlmProviderType, ModelOption[]> = {
  anthropic: [
${renderEntries(catalog.anthropic)}
  ],
  openai: [
${renderEntries(catalog.openai)}
  ],
  google: [
${renderEntries(catalog.google)}
  ],
};

/** Retired id -> same-tier successor. The provider answers 404 for these. */
export const RETIRED_MODELS: Record<
  LlmProviderType,
  Record<string, string>
> = {
${TYPES.map((t) => `  ${t}: ${renderMap(retired[t], JSON.stringify)},`).join("\n")}
};

/** Deprecated id -> successor + retirement date (null while undated). */
export const DEPRECATED_MODELS: Record<
  LlmProviderType,
  Record<string, ModelDeprecation>
> = {
${TYPES.map((t) => `  ${t}: ${renderMap(deprecated[t], renderDeprecation)},`).join("\n")}
};
`;
