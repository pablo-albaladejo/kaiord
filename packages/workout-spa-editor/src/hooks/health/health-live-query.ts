/**
 * Helpers shared by every `useHealth*Live` hook.
 *
 * The hooks themselves stay one-liners over these helpers so the
 * "table name + range" boilerplate is not duplicated six times.
 */
import { db } from "../../adapters/dexie/dexie-database";
import type { HealthRecord } from "../../ports/health-record-repository";

export type HealthDateRange = {
  start: string;
  end: string;
};

export const queryHealthRangeAsync = <T extends HealthRecord<unknown>>(
  tableName: string,
  profileId: string,
  range: HealthDateRange
): Promise<T[]> =>
  db
    .table<T>(tableName)
    .where("[profileId+date]")
    .between([profileId, range.start], [profileId, range.end], true, true)
    .toArray();

export const queryHealthDayAsync = async <T extends HealthRecord<unknown>>(
  tableName: string,
  profileId: string,
  day: string
): Promise<T | undefined> => {
  const rows = await queryHealthRangeAsync<T>(tableName, profileId, {
    start: day,
    end: day,
  });
  return rows[0];
};

export const queryHealthLatestAsync = async <T extends HealthRecord<unknown>>(
  tableName: string,
  profileId: string
): Promise<T | undefined> => {
  const rows = await db
    .table<T>(tableName)
    .where("profileId")
    .equals(profileId)
    .reverse()
    .sortBy("date");
  return rows[0];
};
