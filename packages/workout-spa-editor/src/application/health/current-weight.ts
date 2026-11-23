/**
 * The athlete's current weight has one rule: the weigh-in of the most recent
 * day anyone weighed, however old, because it is a measurement;
 * `profile.bodyWeight` is only the fallback for an athlete who has never
 * weighed in. `undefined` when neither is known.
 *
 * A day two sources weighed reads as the Day does, by the Authority in force
 * (the athlete's own entry, then the scale, then the Platforms that relay a
 * typed number): a Train2Go weigh-in recorded after this morning's scale
 * reading never becomes the current weight by being recorded later.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { resolveEffectiveSource } from "../data-source-policy/resolve-effective-source.use-case";
import { latestUpTo } from "./latest-measurement";

const EARLIEST_DATE = "0000-01-01";
const UNKNOWN_SOURCE = "unknown";

export const getCurrentWeightKg = (
  profile: Pick<Profile, "bodyWeight"> | undefined,
  latestWeighIn: Pick<HealthWeightRecord, "krd"> | undefined
): number | undefined =>
  latestWeighIn?.krd.weightKilograms ?? profile?.bodyWeight;

const sourceOf = (row: HealthWeightRecord): string =>
  row.sourceBridgeId ?? UNKNOWN_SOURCE;

/** Each source's latest row of the day, the most recent one last. */
const latestPerSource = (rows: HealthWeightRecord[]): HealthWeightRecord[] => {
  const bySource = new Map<string, HealthWeightRecord>();
  for (const row of rows) {
    const held = bySource.get(sourceOf(row));
    bySource.set(sourceOf(row), held ? (latestUpTo([held, row]) ?? row) : row);
  }
  return [...bySource.values()].sort((a, b) =>
    latestUpTo([a, b]) === b ? -1 : 1
  );
};

const readDay = async (
  persistence: PersistencePort,
  profileId: string,
  rows: HealthWeightRecord[]
): Promise<HealthWeightRecord | undefined> => {
  const latest = latestUpTo(rows);
  if (!latest) return undefined;
  const day = latestPerSource(rows.filter((r) => r.date === latest.date));
  if (day.length === 1) return latest;
  const result = await resolveEffectiveSource<HealthWeightRecord>(
    {
      sourcePolicyRepo: persistence.dataTypeSourcePolicy,
      policyRepo: persistence.integrationPolicy,
      userPreferences: persistence.userPreferences,
      getRecordsForDay: async () =>
        day.map((record) => ({ sourceBridgeId: sourceOf(record), record })),
    },
    { profileId, dataType: "weight", day: latest.date }
  );
  return result.mode === "union"
    ? latest
    : (result.effective?.record ?? latest);
};

/** The current weigh-in on or before `asOf` (YYYY-MM-DD). */
export const loadLatestWeighIn = async (
  persistence: PersistencePort,
  profileId: string,
  asOf: string
): Promise<HealthWeightRecord | undefined> =>
  readDay(
    persistence,
    profileId,
    await persistence.healthWeight.getByProfileAndDateRange(
      profileId,
      EARLIEST_DATE,
      asOf
    )
  );
