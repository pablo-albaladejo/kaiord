/**
 * A weight from Train2Go is stamped with the bridge's own id, like every other
 * bridge's health rows, so the Data Hub never mistakes it for a typed-in
 * weigh-in. Sources never overwrite each other's rows (the read side, union or
 * priority, decides between them): the upsert reuses only Train2Go's own row
 * of the day, and a manual weigh-in of that day is left untouched.
 */
import { canonicalHash, weightMeasurementSchema } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import { buildWeightPayload } from "../health/manual-health-payload.mapper";
import { stampProvenance } from "../import/stamp-provenance";

export const TRAIN2GO_BRIDGE_ID = "train2go-bridge";

export const recordTrain2GoWeighIn = async (
  persistence: PersistencePort,
  profileId: string,
  kg: number,
  day: string
): Promise<void> => {
  const rows = await persistence.healthWeight.getByProfileAndDateRange(
    profileId,
    day,
    day
  );
  const own = rows.find((r) => r.sourceBridgeId === TRAIN2GO_BRIDGE_ID);
  await persistence.healthWeight.put({
    id: own?.id ?? crypto.randomUUID(),
    profileId,
    date: day,
    krd: weightMeasurementSchema.parse(buildWeightPayload(kg, day)),
    ...stampProvenance(
      TRAIN2GO_BRIDGE_ID,
      canonicalHash({ metric: "weight", day })
    ),
  });
};
