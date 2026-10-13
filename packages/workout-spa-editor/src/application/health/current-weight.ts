/**
 * The athlete's current weight has one rule: the latest weigh-in, however
 * old, because it is a measurement; `profile.bodyWeight` is only the fallback
 * for an athlete who has never weighed in. `undefined` when neither is known.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { latestUpTo } from "../energy/load-day-energy-sources";

const EARLIEST_DATE = "0000-01-01";

export const getCurrentWeightKg = (
  profile: Pick<Profile, "bodyWeight"> | undefined,
  latestWeighIn: Pick<HealthWeightRecord, "krd"> | undefined
): number | undefined =>
  latestWeighIn?.krd.weightKilograms ?? profile?.bodyWeight;

/** Latest weigh-in on or before `asOf` (YYYY-MM-DD). */
export const loadLatestWeighIn = async (
  persistence: PersistencePort,
  profileId: string,
  asOf: string
): Promise<HealthWeightRecord | undefined> =>
  latestUpTo(
    await persistence.healthWeight.getByProfileAndDateRange(
      profileId,
      EARLIEST_DATE,
      asOf
    )
  );
