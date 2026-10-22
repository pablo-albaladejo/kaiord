import { createHash } from "node:crypto";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Object keys sorted recursively; `undefined` members dropped, as JSON does. */
export const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isPlainObject(value)) return value;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] !== undefined) sorted[key] = canonicalize(value[key]);
  }
  return sorted;
};

/**
 * The schema as the request hash sees it: keys sorted and `$schema` removed
 * at every level, nothing else. `title` and `description` stay, because the
 * schema is model-facing and editing one changes what the model is asked.
 */
export const canonicalSchema = (schema: unknown): unknown => {
  if (Array.isArray(schema)) return schema.map(canonicalSchema);
  if (!isPlainObject(schema)) return schema;
  const stripped: Record<string, unknown> = {};
  for (const [key, member] of Object.entries(schema)) {
    if (key !== "$schema") stripped[key] = canonicalSchema(member);
  }
  return canonicalize(stripped);
};

export const sha256Hex = (data: string | Uint8Array): string =>
  createHash("sha256").update(data).digest("hex");

export const hashOf = (value: unknown): string =>
  sha256Hex(JSON.stringify(canonicalize(value)) ?? "null");
