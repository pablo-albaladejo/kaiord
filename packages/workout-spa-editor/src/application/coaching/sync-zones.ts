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
 * Toast/log copy lives in `sync-zones-toasts.ts` as SCREAMING_SNAKE_CASE
 * constants so the `check-no-pii-leakage.mjs` mechanical guard can prove
 * the strings are static (no template interpolation reaches a toast or
 * a `console.*` first-arg), and so the orchestrator can show them without
 * loading this use case eagerly.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { SyncZonesResult, ZonesPayload } from "../../types/coaching-zones";
import { todayIsoDate } from "../../utils/today-iso-date";
import type { CoachingTransport } from "./coaching-transport-port";
import { reconcile } from "./sync-zones-helpers";
import { mapPayloadToIncoming } from "./sync-zones-payload-mapper";
import {
  reconcileWeight,
  recordSyncedWeight,
  splitWeight,
} from "./sync-zones-weight";

export {
  TOAST_ZONES_FETCH_FAILED,
  TOAST_ZONES_SHAPE_MISMATCH,
  TOAST_ZONES_UNSUPPORTED,
} from "./sync-zones-toasts";

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

export const syncZones = async (
  profileId: string,
  transport: CoachingTransport,
  persistence: PersistencePort
): Promise<SyncZonesResult> => {
  const repo = persistence.profiles;
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
  const { weightKg, rest } = splitWeight(mapPayloadToIncoming(payload));
  const today = todayIsoDate();
  // Re-read inside the transaction so an edit saved while Train2Go was being
  // read is merged, not overwritten by the profile read before the fetch.
  return persistence.transaction<SyncZonesResult>(async () => {
    const fresh = await repo.getById(profileId);
    if (!fresh) return { ok: false, reason: "profile-deleted" };
    const weight = await reconcileWeight(persistence, fresh, weightKg, today);
    const result = reconcile(fresh, rest, transport.source);
    // Persist whenever reconcile mutated the profile — covers silent-fills
    // (applied), method-flips on default-template/method-derived tables,
    // and snapshot-write on train2go-synced-clean re-syncs (per D-MA4).
    if (result.profile !== fresh) {
      await repo.put({
        ...result.profile,
        updatedAt: new Date().toISOString(),
      });
    }
    for (const { value } of weight.applied) {
      await recordSyncedWeight(persistence, profileId, value, today);
    }
    return {
      ok: true,
      applied: [...weight.applied, ...result.applied],
      conflicts: [...weight.conflicts, ...result.conflicts],
      payload,
    };
  });
};

export { commitConflictResolution } from "./commit-conflict-resolution";
