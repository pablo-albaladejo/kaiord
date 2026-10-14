/**
 * Reads the daily-wellness rows of a date range and combines them into one
 * reading per day under the data type's source policy. Every reader of
 * daily wellness goes through here instead of picking a row itself.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { HealthDailyRecord } from "../../types/health/health-records";
import { loadPriorityReadPolicy } from "../data-source-policy/effective-source-order";
import { mergeDailyWellnessByDay } from "./merge-daily-wellness";

export type DailyWellnessReadDeps = Pick<
  PersistencePort,
  "healthDaily" | "dataTypeSourcePolicy" | "integrationPolicy"
>;

export const loadDailyWellness = async (
  deps: DailyWellnessReadDeps,
  profileId: string,
  range: { start: string; end: string }
): Promise<HealthDailyRecord[]> => {
  const [rows, policy] = await Promise.all([
    deps.healthDaily.getByProfileAndDateRange(
      profileId,
      range.start,
      range.end
    ),
    loadPriorityReadPolicy(
      {
        sourcePolicyRepo: deps.dataTypeSourcePolicy,
        policyRepo: deps.integrationPolicy,
      },
      { profileId, dataType: "daily-wellness" }
    ),
  ]);
  return mergeDailyWellnessByDay(rows, policy);
};
