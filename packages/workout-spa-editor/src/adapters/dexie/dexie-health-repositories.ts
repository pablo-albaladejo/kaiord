/**
 * Assembles the six per-metric Dexie health-record repositories. Split out of
 * `dexie-persistence-adapter.ts` so that file stays under the per-file line cap
 * as new stores are added; the adapter spreads the returned object.
 */
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStressRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";
import type { KaiordDatabase } from "./dexie-database";
import { createDexieHealthRecordRepository } from "./dexie-health-record-repository";

export const createDexieHealthRecordRepositories = (db: KaiordDatabase) => ({
  healthSleep: createDexieHealthRecordRepository<HealthSleepRecord>(
    db,
    "healthSleep"
  ),
  healthWeight: createDexieHealthRecordRepository<HealthWeightRecord>(
    db,
    "healthWeight"
  ),
  healthHrv: createDexieHealthRecordRepository<HealthHrvRecord>(
    db,
    "healthHrv"
  ),
  healthDaily: createDexieHealthRecordRepository<HealthDailyRecord>(
    db,
    "healthDaily"
  ),
  healthBodyComposition:
    createDexieHealthRecordRepository<HealthBodyCompositionRecord>(
      db,
      "healthBodyComposition"
    ),
  healthStress: createDexieHealthRecordRepository<HealthStressRecord>(
    db,
    "healthStress"
  ),
});
