import { createHash } from "node:crypto";

/**
 * Deterministic SHA-256 hash over a plain object.
 *
 * Recursively sorts object keys (including nested objects and arrays
 * of objects) before serialization so semantically equivalent inputs
 * — regardless of property order at any depth — produce the same
 * digest. Used by MANAGED_DATA_REGISTRY hash projections to derive
 * stable external-id candidates.
 */
const normalize = (value: unknown): unknown => {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(normalize);
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = normalize((value as Record<string, unknown>)[k]);
      return acc;
    }, {});
};

export const canonicalHash = (value: Record<string, unknown>): string =>
  createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
