/**
 * Phase-2 of the zones-sync flow: applies the user's per-row decisions
 * from the conflict dialog. Updates `method` and snapshot per
 * sport-kind table per design D-MA4 of zones-method-aware-reconcile:
 *   - All-accept     → method = "train2go"; snapshot.<sportKind> := T2G's array.
 *   - Mixed (partial accept) → method = "user"; snapshot.<sportKind> :=
 *     post-merge persisted zones (accepted bands take T2G; rejected
 *     bands keep pre-sync user value).
 *   - All-reject     → method/snapshot untouched.
 *
 * Idempotent — calling twice with the same `decisions` produces the
 * same final state.
 */
import type { ProfileRepository } from "../../ports/persistence-port";
import type {
  ConflictDecision,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { ProfileNotFoundError } from "../profile/errors";
import { applyBandTableDecisions } from "./commit-conflict-band-tables";
import { mapPayloadToIncoming } from "./sync-zones-payload-mapper";
import { writeField } from "./sync-zones-profile-fields";
import { tableKeyOfField } from "./sync-zones-snapshot";

const partitionDecisions = (
  decisions: Record<FieldKey, ConflictDecision>
): {
  thresholdKeys: FieldKey[];
  bandTableKeys: Map<string, FieldKey[]>;
} => {
  const thresholdKeys: FieldKey[] = [];
  const bandTableKeys = new Map<string, FieldKey[]>();
  for (const key of Object.keys(decisions) as FieldKey[]) {
    const tk = tableKeyOfField(key);
    if (!tk) {
      thresholdKeys.push(key);
      continue;
    }
    const slot = `${tk.sport}.${tk.kind}`;
    let entry = bandTableKeys.get(slot);
    if (!entry) {
      entry = [];
      bandTableKeys.set(slot, entry);
    }
    entry.push(key);
  }
  return { thresholdKeys, bandTableKeys };
};

const applyThresholdDecisions = (
  profile: Profile,
  thresholdKeys: FieldKey[],
  decisions: Record<FieldKey, ConflictDecision>,
  incoming: Map<FieldKey, number>
): Profile => {
  let next = profile;
  for (const key of thresholdKeys) {
    if (decisions[key] !== "accept") continue;
    const value = incoming.get(key);
    if (value === undefined) continue;
    next = writeField(next, key, value);
  }
  return next;
};

export const commitConflictResolution = async (
  profileId: string,
  decisions: Record<FieldKey, ConflictDecision>,
  repo: ProfileRepository,
  transportPayload: ZonesPayload,
  source = "train2go"
): Promise<void> => {
  const profile = await repo.getById(profileId);
  if (!profile) throw new ProfileNotFoundError(profileId);
  const incoming = mapPayloadToIncoming(transportPayload);
  const { thresholdKeys, bandTableKeys } = partitionDecisions(decisions);
  let next = applyThresholdDecisions(profile, thresholdKeys, decisions, incoming);
  next = applyBandTableDecisions(
    next,
    bandTableKeys,
    decisions,
    incoming,
    source
  );
  if (next !== profile) {
    await repo.put({ ...next, updatedAt: new Date().toISOString() });
  }
};
