import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Deterministic SHA-256 hash over a plain object.
 *
 * Recursively sorts object keys (including nested objects and arrays
 * of objects) before serialization so semantically equivalent inputs
 * — regardless of property order at any depth — produce the same
 * digest. Used by MANAGED_DATA_REGISTRY hash projections to derive
 * stable external-id candidates.
 *
 * Uses a sync, isomorphic SHA-256 (@noble/hashes) instead of Node's
 * `node:crypto`. The previous `node:crypto` import broke the browser
 * bundle — the build emitted a bare `crypto` import and `createHash`
 * was `undefined` at runtime, crashing any browser code path that
 * hashed an export payload. The UTF-8 bytes hashed and the hex output
 * are byte-for-byte identical to the old implementation, so persisted
 * external-ids stay stable.
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
  bytesToHex(
    sha256(new TextEncoder().encode(JSON.stringify(normalize(value))))
  );
