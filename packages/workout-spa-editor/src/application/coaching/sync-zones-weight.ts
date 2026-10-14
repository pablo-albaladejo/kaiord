/**
 * Train2Go's weight is the athlete's current weight, so it is compared through
 * `getCurrentWeightKg` and written as a Train2Go weigh-in for today;
 * `profile.bodyWeight` is never touched. A weight Train2Go already reported
 * (its own latest weigh-in) is not news: re-syncing it records nothing and
 * raises no conflict, even when another source weighed in since.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { todayIsoDate } from "../../utils/today-iso-date";
import { latestUpTo } from "../energy/load-day-energy-sources";
import { getCurrentWeightKg } from "../health/current-weight";
import {
  recordTrain2GoWeighIn,
  TRAIN2GO_BRIDGE_ID,
} from "./record-train2go-weigh-in";
import type { IncomingMap } from "./sync-zones-payload-mapper";

export const WEIGHT_FIELD: FieldKey = "bodyWeight";
const EARLIEST_DATE = "0000-01-01";
const NOTHING = { applied: [], conflicts: [] };

export const splitWeight = (
  incoming: IncomingMap
): { weightKg: number | undefined; rest: IncomingMap } => {
  const rest: IncomingMap = new Map(incoming);
  rest.delete(WEIGHT_FIELD);
  return { weightKg: incoming.get(WEIGHT_FIELD), rest };
};

export const reconcileWeight = async (
  persistence: PersistencePort,
  profile: Profile,
  incomingKg: number | undefined
): Promise<{ applied: WrittenField[]; conflicts: ConflictItem[] }> => {
  if (incomingKg === undefined) return NOTHING;
  const rows = await persistence.healthWeight.getByProfileAndDateRange(
    profile.id,
    EARLIEST_DATE,
    todayIsoDate()
  );
  const reported = latestUpTo(
    rows.filter((r) => r.sourceBridgeId === TRAIN2GO_BRIDGE_ID)
  );
  if (reported?.krd.weightKilograms === incomingKg) return NOTHING;
  const current = getCurrentWeightKg(profile, latestUpTo(rows));
  if (current === undefined) {
    return {
      applied: [{ field: WEIGHT_FIELD, value: incomingKg }],
      conflicts: [],
    };
  }
  if (current === incomingKg) return NOTHING;
  return {
    applied: [],
    conflicts: [{ field: WEIGHT_FIELD, current, incoming: incomingKg }],
  };
};

export const recordSyncedWeight = async (
  persistence: PersistencePort,
  profileId: string,
  kg: number
): Promise<void> => {
  await recordTrain2GoWeighIn(persistence, profileId, kg, todayIsoDate());
};
