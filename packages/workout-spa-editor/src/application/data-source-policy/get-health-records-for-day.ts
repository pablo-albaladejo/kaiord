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

import type { HealthRecord } from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import type { SourcedRecord } from "./resolve-effective-source.use-case";

const UNKNOWN_SOURCE_BRIDGE_ID = "unknown";

const HEALTH_REPO_KEY_FOR_TYPE: Partial<Record<ManagedDataType, keyof PersistencePort>> = {
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
  const repo = persistence[repoKey] as {
    getByProfileAndDateRange: (
      profileId: string,
      start: string,
      end: string
    ) => Promise<HealthRecord<T>[]>;
  };
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
