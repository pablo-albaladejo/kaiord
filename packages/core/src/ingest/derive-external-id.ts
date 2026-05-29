import { canonicalHash } from "../hash/canonical-hash";

/**
 * Derives a stable external id for a health record from its payload +
 * measuredAt timestamp.
 *
 * The `k1:` prefix is a version tag: if the hash projection ever changes,
 * the prefix can be bumped to `k2:` so downstream migration code can
 * distinguish old ids from new ones without inspecting content.
 */
export const deriveExternalId = (input: {
  payload: Record<string, unknown>;
  measuredAt: string;
}): string =>
  "k1:" +
  canonicalHash({ payload: input.payload, measuredAt: input.measuredAt });
