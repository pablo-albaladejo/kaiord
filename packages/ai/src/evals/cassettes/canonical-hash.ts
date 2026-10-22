import { createHash } from "node:crypto";

const isPlainObject = (value: object): value is Record<string, unknown> => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/** Reserved key prefix for tagged values; a plain object may not use it. */
const TAG = "\u0000";

/**
 * Values JSON would collapse to `{}` (a URL, a Date, a byte array) are
 * serialized by content under a type tag, so they never share a hash with a
 * string or a plain array. Any other class instance is rejected.
 */
const scalarOf = (value: object): unknown => {
  if (value instanceof URL) return { [`${TAG}URL`]: value.href };
  if (value instanceof Date) return { [`${TAG}Date`]: value.toISOString() };
  if (ArrayBuffer.isView(value)) {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength
    );
    return { [`${TAG}bytes`]: Array.from(bytes) };
  }
  throw new TypeError(
    `cannot canonicalize a ${value.constructor?.name ?? "non-plain object"}`
  );
};

/** Object keys sorted recursively; `undefined` members dropped, as JSON does. */
export const canonicalize = (value: unknown): unknown => {
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isPlainObject(value)) return scalarOf(value);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    if (key.startsWith(TAG))
      throw new TypeError(`reserved key ${JSON.stringify(key)}`);
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
  if (typeof schema !== "object" || schema === null) return schema;
  if (!isPlainObject(schema)) return canonicalize(schema);
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
