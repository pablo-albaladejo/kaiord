/**
 * Train2Go's weight is the athlete's current weight, so it is read through
 * `getCurrentWeightKg` and written as today's weigh-in, the way the Athlete
 * page records it; `profile.bodyWeight` is never touched. Re-syncing the same
 * weight finds it equal to the current weight and records nothing, and a
 * same-day write updates that day's weigh-in instead of adding one.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { todayIsoDate } from "../../utils/today-iso-date";
import {
  getCurrentWeightKg,
  loadLatestWeighIn,
} from "../health/current-weight";
import { saveManualHealthMetric } from "../health/save-manual-health-metric.use-case";
import type { IncomingMap } from "./sync-zones-payload-mapper";

export const WEIGHT_FIELD: FieldKey = "bodyWeight";

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
  if (incomingKg === undefined) return { applied: [], conflicts: [] };
  const latest = await loadLatestWeighIn(
    persistence,
    profile.id,
    todayIsoDate()
  );
  const current = getCurrentWeightKg(profile, latest);
  if (current === undefined) {
    return {
      applied: [{ field: WEIGHT_FIELD, value: incomingKg }],
      conflicts: [],
    };
  }
  if (current === incomingKg) return { applied: [], conflicts: [] };
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
  await saveManualHealthMetric(
    { persistence, profileId },
    { metric: "weight", day: todayIsoDate(), value: kg }
  );
};
