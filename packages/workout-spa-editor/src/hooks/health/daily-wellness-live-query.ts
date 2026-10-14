/**
 * Daily-wellness reads for the live hooks: one reading per day, combined
 * across sources by `loadDailyWellness`. Reads the source policy too, so
 * a change to it re-runs the subscribing `useLiveQuery`.
 */
import { createDexieDataTypeSourcePolicyRepository } from "../../adapters/dexie/dexie-data-type-source-policy-repository";
import { db } from "../../adapters/dexie/dexie-database";
import { createDexieHealthRecordRepository } from "../../adapters/dexie/dexie-health-record-repository";
import { createDexieIntegrationPolicyRepository } from "../../adapters/dexie/dexie-integration-policy-repository";
import {
  type DailyWellnessReadDeps,
  loadDailyWellness,
} from "../../application/health/load-daily-wellness";
import type { HealthDailyRecord } from "../../types/health/health-records";
import type { HealthDateRange } from "./health-live-query";

const deps: DailyWellnessReadDeps = {
  healthDaily: createDexieHealthRecordRepository<HealthDailyRecord>(
    db,
    "healthDaily"
  ),
  dataTypeSourcePolicy: createDexieDataTypeSourcePolicyRepository(db),
  integrationPolicy: createDexieIntegrationPolicyRepository(db),
};

export const queryDailyWellnessRangeAsync = (
  profileId: string,
  range: HealthDateRange
): Promise<HealthDailyRecord[]> => loadDailyWellness(deps, profileId, range);

export const queryDailyWellnessDayAsync = async (
  profileId: string,
  day: string
): Promise<HealthDailyRecord | undefined> => {
  const [reading] = await queryDailyWellnessRangeAsync(profileId, {
    start: day,
    end: day,
  });
  return reading;
};
