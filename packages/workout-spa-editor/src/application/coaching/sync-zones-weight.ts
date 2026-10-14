/**
 * Train2Go's weight is the athlete's current weight, so it is compared through
 * `getCurrentWeightKg` and written as a Train2Go weigh-in for today;
 * `profile.bodyWeight` is never touched. A weight Train2Go already reported
 * (its own latest weigh-in) is not news: re-syncing it records nothing and
 * raises no conflict, even when another source weighed in since.
 *
 * The weight route (weight · import · train2go-bridge) governs both: switched
 * off, the weight is neither recorded nor asked about. No route at all — an
 * extension that does not announce `read:body`, or a link made before it did —
 * keeps the weight flowing as it did before the route existed.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
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

const weightRouteOff = async (
  persistence: PersistencePort,
  profileId: string
): Promise<boolean> => {
  const route = await persistence.integrationPolicy.findByNaturalKey({
    profileId,
    dataType: "weight",
    direction: "import",
    bridgeId: TRAIN2GO_BRIDGE_ID,
  });
  return route !== undefined && !route.enabled;
};

export const reconcileWeight = async (
  persistence: PersistencePort,
  profile: Profile,
  incomingKg: number | undefined,
  today: string
): Promise<{ applied: WrittenField[]; conflicts: ConflictItem[] }> => {
  if (incomingKg === undefined) return NOTHING;
  if (await weightRouteOff(persistence, profile.id)) return NOTHING;
  const rows = await persistence.healthWeight.getByProfileAndDateRange(
    profile.id,
    EARLIEST_DATE,
    today
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
  kg: number,
  today: string
): Promise<void> => {
  if (await weightRouteOff(persistence, profileId)) return;
  await recordTrain2GoWeighIn(persistence, profileId, kg, today);
};
