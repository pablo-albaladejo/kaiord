/**
 * getHealthRecordsForDay — default `getRecordsForDay` implementation for
 * `resolveEffectiveSource` over the six health-metric tables.
 *
 * Each health row already carries its real `sourceBridgeId` (F1.1); this
 * just fans out to the right per-metric repo on `PersistencePort` and
 * tags each row with its source. Not React, not Dexie — depends only on
 * the already-injected persistence port.
 */
import type { ManagedDataType } from "@kaiord/core";

import type {
  HealthRecord,
  HealthRecordRepository,
} from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import type { SourcedRecord } from "./resolve-effective-source.use-case";

const UNKNOWN_SOURCE_BRIDGE_ID = "unknown";

type HealthMetricRepoKey =
  | "healthWeight"
  | "healthSleep"
  | "healthHrv"
  | "healthDaily"
  | "healthBodyComposition"
  | "healthStress";

/** Exported so callers can test "does this data type have a health-table
    reader?" (e.g. the chat hub tools) without duplicating this mapping. */
export const HEALTH_REPO_KEY_FOR_TYPE: Partial<
  Record<ManagedDataType, HealthMetricRepoKey>
> = {
  weight: "healthWeight",
  sleep: "healthSleep",
  hrv: "healthHrv",
  "daily-wellness": "healthDaily",
  "body-composition": "healthBodyComposition",
  stress: "healthStress",
};

export const getHealthRecordsForDay = async <T>(
  persistence: PersistencePort,
  input: { profileId: string; dataType: ManagedDataType; day: string }
): Promise<SourcedRecord<T>[]> => {
  const repoKey = HEALTH_REPO_KEY_FOR_TYPE[input.dataType];
  if (!repoKey) return [];
  // repoKey is narrowed to the six health-metric keys (not `keyof
  // PersistencePort` at large), so this indexed access is exactly the
  // union of the six typed HealthRecordRepository<X> members — each
  // structurally identical to HealthRecordRepository<HealthRecord<T>>,
  // just parameterized on this call's own T. The double-assertion is
  // required because T is unconstrained, not because the shapes differ.
  const repo = persistence[repoKey] as unknown as HealthRecordRepository<
    HealthRecord<T>
  >;
  const rows = await repo.getByProfileAndDateRange(
    input.profileId,
    input.day,
    input.day
  );
  return rows.map((row) => ({
    sourceBridgeId: row.sourceBridgeId ?? UNKNOWN_SOURCE_BRIDGE_ID,
    record: row.krd,
  }));
};
