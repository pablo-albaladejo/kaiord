/**
 * `syncZones` — application use case for the Train2Go zones-sync flow.
 *
 * Two-phase contract (design D1):
 *   1. `syncZones`  — fetches the bridge payload, eagerly writes silent
 *                     fills, returns conflicts UNWRITTEN for the UI.
 *   2. `commitConflictResolution` — applies the user's per-row
 *                                   accept/reject decisions. Idempotent.
 *
 * Heartbeat-safe: the use case mutates the profile only via the
 * supplied repo, never via a side channel. Callers are responsible for
 * invoking it ONLY from explicit user actions (connect, manual sync) —
 * mirroring the same invariant `attempt-link.ts` enforces.
 *
 * Toast/log copy lives at the top of this file as SCREAMING_SNAKE_CASE
 * constants so the `check-no-pii-leakage.mjs` mechanical guard can prove
 * the strings are static (no template interpolation reaches a toast or
 * a `console.*` first-arg).
 */
import type { ProfileRepository } from "../../ports/persistence-port";
import type { SyncZonesResult, ZonesPayload } from "../../types/coaching-zones";
import type { CoachingTransport } from "./coaching-transport-port";
import { reconcile } from "./sync-zones-helpers";
import { mapPayloadToIncoming } from "./sync-zones-payload-mapper";

export const TOAST_ZONES_FETCH_FAILED =
  "Couldn't fetch zones from Train2Go — try again later";
export const TOAST_ZONES_SHAPE_MISMATCH =
  "Train2Go returned an unexpected shape — zones not synced";
export const TOAST_ZONES_UNSUPPORTED =
  "This coaching platform doesn't support zones sync";
export const LOG_ZONES_SYNC_RUN = "zones-sync.run";

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

export const syncZones = async (
  profileId: string,
  transport: CoachingTransport,
  repo: ProfileRepository
): Promise<SyncZonesResult> => {
  if (!transport.readZones) {
    return { ok: false, reason: "unsupported" };
  }
  const profile = await repo.getById(profileId);
  if (!profile) {
    return { ok: false, reason: "profile-deleted" };
  }
  const link = profile.linkedAccounts.find(
    (a) => a.source === transport.source
  );
  if (!link) {
    return { ok: false, reason: "unsupported" };
  }
  let payload: ZonesPayload | null;
  try {
    payload = await transport.readZones(link.externalUserId);
  } catch (e) {
    return { ok: false, reason: "transport-error", error: errorMessage(e) };
  }
  if (!payload) {
    return { ok: false, reason: "shape-mismatch" };
  }
  const incoming = mapPayloadToIncoming(payload);
  const result = reconcile(profile, incoming, transport.source);
  // Persist whenever reconcile mutated the profile — covers silent-fills
  // (applied), method-flips on default-template/method-derived tables,
  // and snapshot-write on train2go-synced-clean re-syncs (per D-MA4).
  if (result.profile !== profile) {
    await repo.put({
      ...result.profile,
      updatedAt: new Date().toISOString(),
    });
  }
  return {
    ok: true,
    applied: result.applied,
    conflicts: result.conflicts,
    payload,
  };
};

export { commitConflictResolution } from "./commit-conflict-resolution";
