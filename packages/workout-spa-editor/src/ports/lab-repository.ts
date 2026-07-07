/**
 * LabRepository
 *
 * Persistence port for the v31 lab-analytics stores (`labReports`,
 * `labValues`). A dedicated repo over BOTH tables — the generic
 * health-record factory only exposes `[profileId+date]`, which cannot serve
 * the per-parameter series (`[profileId+parameterKey+date]`) or the
 * per-report read (`[profileId+reportId]`) that labs need.
 *
 * Every read below is served by a Dexie index (no full table scan). Writes
 * are single-table primitives; the atomic report+values write and the
 * report+values delete are composed by the `application/lab` use cases
 * inside `persistence.transaction(...)`.
 */
import type { LabReport, LabValue } from "@kaiord/core";

export type LabRepository = {
  /** Insert-or-replace one report (PK `id`). */
  putReport: (report: LabReport) => Promise<void>;
  /** Insert-or-replace N values in one bulk write (PK `id`). */
  putValues: (values: readonly LabValue[]) => Promise<void>;
  /** Delete one report by its PK. */
  deleteReport: (reportId: string) => Promise<void>;
  /** Delete every value of one report via `[profileId+reportId]`. */
  deleteValuesByReport: (profileId: string, reportId: string) => Promise<void>;
  /** One report by PK, or undefined. */
  getReport: (reportId: string) => Promise<LabReport | undefined>;
  /** All reports for a profile, by `[profileId+date]` (listing). */
  listReports: (profileId: string) => Promise<LabReport[]>;
  /** All values of one report, by `[profileId+reportId]`. */
  getValuesByReport: (
    profileId: string,
    reportId: string
  ) => Promise<LabValue[]>;
  /** The time series of one parameter, by `[profileId+parameterKey+date]`. */
  getValueSeries: (
    profileId: string,
    parameterKey: string
  ) => Promise<LabValue[]>;
  /**
   * Every value for a profile via a `[profileId+parameterKey+date]`
   * prefix-scan — feeds the in-memory latest-per-parameter group-by.
   */
  getValuesByProfile: (profileId: string) => Promise<LabValue[]>;
  /** Profile-delete cascade: clear BOTH lab tables for the profile. */
  deleteByProfile: (profileId: string) => Promise<void>;
};
