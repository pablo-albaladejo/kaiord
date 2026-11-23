/**
 * "Use Train2Go's": writes Train2Go's number for every zone and threshold
 * the sync found different, the athlete's one action on the offer. Each
 * sport-kind table it writes a band of takes `method = "train2go"` and its
 * snapshot is the post-write table (D-MA4), so the next sync reads it as
 * synced-clean and offers nothing. Weight is never here: it is a Train2Go
 * weigh-in read by the Authority rule (`sync-zones-weight.ts`).
 *
 * Idempotent — calling twice with the same items produces the same state.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem } from "../../types/coaching-zones";
import { ProfileNotFoundError } from "../profile/errors";
import { applyBandTables } from "./commit-conflict-band-tables";
import { partitionFields } from "./commit-conflict-partition";
import { writeField } from "./sync-zones-profile-fields";
import { WEIGHT_FIELD } from "./sync-zones-weight";

export const commitConflictResolution = async (
  profileId: string,
  conflicts: readonly ConflictItem[],
  persistence: PersistencePort,
  source = "train2go"
): Promise<void> => {
  const repo = persistence.profiles;
  const taken = conflicts.filter((c) => c.field !== WEIGHT_FIELD);
  const { thresholds, bandTables } = partitionFields(taken);
  await persistence.transaction(async () => {
    const profile = await repo.getById(profileId);
    if (!profile) throw new ProfileNotFoundError(profileId);
    const withThresholds = thresholds.reduce(
      (next, c) => writeField(next, c.field, c.incoming),
      profile
    );
    const next = applyBandTables(withThresholds, bandTables, source);
    if (next !== profile) {
      await repo.put({ ...next, updatedAt: new Date().toISOString() });
    }
  });
};
