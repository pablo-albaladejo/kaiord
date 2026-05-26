import { createHash } from "node:crypto";

/**
 * Deterministic SHA-256 hash over a plain object.
 *
 * Keys are sorted recursively before serialization so that
 * `{ b: 1, a: 2 }` and `{ a: 2, b: 1 }` produce the same digest.
 * Used by MANAGED_DATA_REGISTRY hash projections to derive stable
 * external-id candidates.
 */
const sortedStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  const sorted = Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = sortedStringify((value as Record<string, unknown>)[k]);
      return acc;
    }, {});
  return JSON.stringify(sorted);
};

export const canonicalHash = (value: Record<string, unknown>): string =>
  createHash("sha256").update(sortedStringify(value)).digest("hex");
