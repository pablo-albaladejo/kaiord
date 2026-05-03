/**
 * Phase-2 of the zones-sync flow: applies the user's per-row decisions
 * from the conflict dialog.
 *
 * Idempotent — calling twice with the same `decisions` produces the
 * same final state. `transportPayload` is the raw bridge payload from
 * the preceding `syncZones` call; the function re-derives the
 * incoming-value map so the UI doesn't have to remember it.
 */
import type { ProfileRepository } from "../../ports/persistence-port";
import type {
  ConflictDecision,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";
import { ProfileNotFoundError } from "../profile/errors";
import { mapPayloadToIncoming } from "./sync-zones-payload-mapper";
import { writeField } from "./sync-zones-profile-fields";

export const commitConflictResolution = async (
  profileId: string,
  decisions: Record<FieldKey, ConflictDecision>,
  repo: ProfileRepository,
  transportPayload: ZonesPayload
): Promise<void> => {
  const profile = await repo.getById(profileId);
  if (!profile) {
    throw new ProfileNotFoundError(profileId);
  }
  const incoming = mapPayloadToIncoming(transportPayload);
  let next = profile;
  let touched = false;
  for (const key of Object.keys(decisions) as FieldKey[]) {
    if (decisions[key] !== "accept") continue;
    const value = incoming.get(key);
    if (value === undefined) continue;
    next = writeField(next, key, value);
    touched = true;
  }
  if (touched) {
    await repo.put({ ...next, updatedAt: new Date().toISOString() });
  }
};
