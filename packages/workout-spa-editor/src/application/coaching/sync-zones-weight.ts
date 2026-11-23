/**
 * Train2Go's weight is a Train2Go weigh-in, never one of the athlete's numbers:
 * it is recorded as Train2Go's own row for today and never offered as a
 * difference, and which weigh-in a day reads is the Authority rule's to decide
 * (`current-weight.ts`). `profile.bodyWeight` is never touched. A weight
 * Train2Go already reported (its own latest weigh-in) is not news: re-syncing
 * it records nothing, and neither does the weight the athlete already reads.
 *
 * The weight route (weight · import · train2go-bridge) governs both: switched
 * off, the weight is not recorded. No route at all — an
 * extension that does not announce `read:body`, or a link made before it did —
 * keeps the weight flowing as it did before the route existed.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { FieldKey, WrittenField } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import {
  getCurrentWeightKg,
  loadLatestWeighIn,
} from "../health/current-weight";
import { latestUpTo } from "../health/latest-measurement";
import {
  recordTrain2GoWeighIn,
  TRAIN2GO_BRIDGE_ID,
} from "./record-train2go-weigh-in";
import type { IncomingMap } from "./sync-zones-payload-mapper";

export const WEIGHT_FIELD: FieldKey = "bodyWeight";
const EARLIEST_DATE = "0000-01-01";

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

/** Records Train2Go's weight when it is news; returns what was written. */
export const recordTrain2GoWeight = async (
  persistence: PersistencePort,
  profile: Profile,
  incomingKg: number | undefined,
  today: string
): Promise<WrittenField[]> => {
  const profileId = profile.id;
  if (incomingKg === undefined) return [];
  if (await weightRouteOff(persistence, profileId)) return [];
  const rows = await persistence.healthWeight.getByProfileAndDateRange(
    profileId,
    EARLIEST_DATE,
    today
  );
  const reported = latestUpTo(
    rows.filter((r) => r.sourceBridgeId === TRAIN2GO_BRIDGE_ID)
  );
  if (reported?.krd.weightKilograms === incomingKg) return [];
  const current = getCurrentWeightKg(
    profile,
    await loadLatestWeighIn(persistence, profileId, today)
  );
  if (current === incomingKg) return [];
  await recordTrain2GoWeighIn(persistence, profileId, incomingKg, today);
  return [{ field: WEIGHT_FIELD, value: incomingKg }];
};
