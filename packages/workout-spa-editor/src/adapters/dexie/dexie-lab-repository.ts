/**
 * Dexie implementation of LabRepository (v31 `labReports` + `labValues`).
 *
 * Range sentinels `""`..`"￿"` bound each compound-index prefix-scan so a
 * profile's rows are served straight from the index (mirrors the
 * energy-balance range-delete). `getValuesByProfile` scans the
 * `[profileId+parameterKey+date]` prefix for the latest-per-parameter query.
 */
import type { LabReport, LabValue } from "@kaiord/core";

import type { LabRepository } from "../../ports/lab-repository";
import type { KaiordDatabase } from "./dexie-database";

const LOW = "";
const HIGH = "￿";

export const createDexieLabRepository = (db: KaiordDatabase): LabRepository => {
  const reports = () => db.table<LabReport>("labReports");
  const values = () => db.table<LabValue>("labValues");
  return {
    putReport: async (report) => {
      await reports().put(report);
    },
    putValues: async (rows) => {
      await values().bulkPut([...rows]);
    },
    deleteReport: async (reportId) => {
      await reports().delete(reportId);
    },
    deleteValuesByReport: async (profileId, reportId) => {
      await values()
        .where("[profileId+reportId]")
        .equals([profileId, reportId])
        .delete();
    },
    getReport: async (reportId) => (await reports().get(reportId)) ?? undefined,
    listReports: async (profileId) =>
      reports()
        .where("[profileId+date]")
        .between([profileId, LOW], [profileId, HIGH], true, true)
        .toArray(),
    getValuesByReport: async (profileId, reportId) =>
      values()
        .where("[profileId+reportId]")
        .equals([profileId, reportId])
        .toArray(),
    getValueSeries: async (profileId, parameterKey) =>
      values()
        .where("[profileId+parameterKey+date]")
        .between(
          [profileId, parameterKey, LOW],
          [profileId, parameterKey, HIGH],
          true,
          true
        )
        .toArray(),
    getValuesByProfile: async (profileId) =>
      values()
        .where("[profileId+parameterKey+date]")
        .between([profileId, LOW, LOW], [profileId, HIGH, HIGH], true, true)
        .toArray(),
    deleteByProfile: async (profileId) => {
      await Promise.all([
        reports()
          .where("[profileId+date]")
          .between([profileId, LOW], [profileId, HIGH], true, true)
          .delete(),
        values()
          .where("[profileId+parameterKey+date]")
          .between([profileId, LOW, LOW], [profileId, HIGH, HIGH], true, true)
          .delete(),
      ]);
    },
  };
};
