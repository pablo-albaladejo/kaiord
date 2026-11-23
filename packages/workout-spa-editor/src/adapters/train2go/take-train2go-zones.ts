import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem } from "../../types/coaching-zones";

/**
 * "Use Train2Go's": writes Train2Go's number for each differing zone and
 * threshold, then closes the athlete's open offer. Both modules load on first
 * use, outside the initial JS. `false` when they could not load; a failed
 * write is thrown, as from any use case.
 */
export const takeTrain2GoZones = async (
  profileId: string,
  conflicts: readonly ConflictItem[],
  persistence: PersistencePort
): Promise<boolean> => {
  const commit = await lazyImport(
    () => import("../../application/coaching/commit-conflict-resolution")
  ).catch(() => null);
  if (!commit) return false;
  await commit.commitConflictResolution(profileId, conflicts, persistence);
  const memo = await lazyImport(() => import("./zones-offer-memo")).catch(
    () => null
  );
  memo?.settleZonesOffer(profileId);
  return true;
};
