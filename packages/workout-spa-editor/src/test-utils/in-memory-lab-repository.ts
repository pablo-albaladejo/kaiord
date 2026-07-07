/**
 * In-memory LabRepository twin (mirrors the Dexie implementation's surface).
 *
 * The two stores are externally owned so `createInMemoryPersistence` can
 * snapshot/restore them inside its `transaction(fn)` wrapper. Reads return the
 * matching SET (order-independent); the latest-per-parameter ordering is
 * resolved deterministically by the `getLatestValues` use case, so this twin
 * and the Dexie repo agree without replicating Dexie's index sort.
 */
import type { LabReport, LabValue } from "@kaiord/core";

import type { LabRepository } from "../ports/lab-repository";

export const createInMemoryLabRepository = (
  reports: Map<string, LabReport> = new Map(),
  values: Map<string, LabValue> = new Map()
): LabRepository => {
  const valuesFor = (predicate: (v: LabValue) => boolean): LabValue[] =>
    [...values.values()].filter(predicate);
  return {
    putReport: async (report) => {
      reports.set(report.id, report);
    },
    putValues: async (rows) => {
      for (const row of rows) values.set(row.id, row);
    },
    deleteReport: async (reportId) => {
      reports.delete(reportId);
    },
    deleteValuesByReport: async (profileId, reportId) => {
      for (const [id, v] of values) {
        if (v.profileId === profileId && v.reportId === reportId)
          values.delete(id);
      }
    },
    getReport: async (reportId) => reports.get(reportId),
    listReports: async (profileId) =>
      [...reports.values()].filter((r) => r.profileId === profileId),
    getValuesByReport: async (profileId, reportId) =>
      valuesFor((v) => v.profileId === profileId && v.reportId === reportId),
    getValueSeries: async (profileId, parameterKey) =>
      valuesFor(
        (v) => v.profileId === profileId && v.parameterKey === parameterKey
      ),
    getValuesByProfile: async (profileId) =>
      valuesFor((v) => v.profileId === profileId),
    deleteByProfile: async (profileId) => {
      for (const [id, r] of reports) {
        if (r.profileId === profileId) reports.delete(id);
      }
      for (const [id, v] of values) {
        if (v.profileId === profileId) values.delete(id);
      }
    },
  };
};
