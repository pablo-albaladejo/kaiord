/**
 * Profile Snapshot — cross-cutting protocol contract
 *
 * Owned by the SPA Bridge Protocol capability. The SPA derives a snapshot
 * from its domain Profile and pushes it to every VERIFIED bridge so the
 * bridge popup can render athlete data without a network call.
 *
 * Why @kaiord/core: same precedent as bridgeManifestSchema — only package
 * both the SPA and any bridge can structurally agree on without a layering
 * inversion. The runtime has no module-loading path between the SPA and
 * a bridge; the schema serves as the source of truth for the SPA's
 * Zod parser AND for each bridge's hand-rolled plain-JS structural
 * validator (parity-tested via shared fixtures).
 */

import { z } from "zod";

const SNAPSHOT_LENGTH_LIMIT = 8192;

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const containsPollutedKey = (
  input: unknown,
  visited: WeakSet<object> = new WeakSet()
): boolean => {
  if (input === null || typeof input !== "object") return false;
  if (visited.has(input)) return false;
  visited.add(input);
  for (const key of Object.getOwnPropertyNames(input)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (containsPollutedKey((input as Record<string, unknown>)[key], visited))
      return true;
  }
  return false;
};

const positiveInt = z.number().int().positive();

const innerSchema = z
  .object({
    schemaVersion: z.literal(1),
    profile: z
      .object({
        name: z.string().min(1).max(100),
        bodyWeight: z.number().positive().optional(),
      })
      .strict(),
    activeSport: z.enum(["cycling", "running", "swimming"]).optional(),
    thresholds: z
      .object({
        cycling: z.object({ ftp: positiveInt.optional() }).strict().optional(),
        running: z
          .object({
            thresholdPaceSecPerKm: positiveInt.optional(),
            lthr: positiveInt.optional(),
          })
          .strict()
          .optional(),
        swimming: z
          .object({ cssPaceSecPer100m: positiveInt.optional() })
          .strict()
          .optional(),
      })
      .strict()
      .default({}),
    heartRate: z
      .object({
        max: positiveInt.optional(),
        lthr: positiveInt.optional(),
      })
      .strict()
      .default({}),
    generatedAt: z.iso.datetime(),
  })
  .strict();

export const profileSnapshotSchema = z
  .unknown()
  .superRefine((value, ctx) => {
    if (containsPollutedKey(value)) {
      ctx.addIssue({ code: "custom", message: "Invalid snapshot payload" });
      return;
    }
    if (typeof value === "object" && value !== null) {
      try {
        if (JSON.stringify(value).length > SNAPSHOT_LENGTH_LIMIT) {
          ctx.addIssue({ code: "custom", message: "Snapshot too large" });
        }
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid snapshot payload" });
      }
    }
  })
  .pipe(innerSchema);

export type ProfileSnapshot = z.infer<typeof profileSnapshotSchema>;

/**
 * Days after which a cached snapshot is considered stale and the popup
 * SHALL render the placeholder instead of the cached athlete card.
 *
 * Rationale: a training-week cadence; revisit if telemetry from
 * registered bridges suggests otherwise.
 */
export const STALE_SNAPSHOT_THRESHOLD_DAYS = 7;

/**
 * Stable content hash of (profile.id, snapshot fields excluding generatedAt).
 *
 * Used by the SPA's per-bridge push de-duplication: two snapshots that
 * differ only because they were derived seconds apart from identical
 * profile state collapse to one transport call.
 *
 * Implementation: FNV-1a 32-bit on the canonical JSON serialization of
 * the snapshot with `generatedAt` excluded. The `profileId` argument is
 * concatenated as a length-prefixed prefix so two profiles with the
 * same fields cannot collide. Returns 8-character lowercase hex.
 *
 * Stability is guaranteed by this implementation; consumers MUST NOT
 * re-implement the hash. Bridges SHALL NOT compute or compare
 * fingerprints — de-duplication is a SPA-side optimization.
 */
export const fingerprintSnapshot = (
  profileId: string,
  snapshot: ProfileSnapshot
): string => {
  const { generatedAt: _ignored, ...rest } = snapshot;
  void _ignored;
  const payload = `${profileId.length}:${profileId}|${JSON.stringify(rest)}`;

  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};
