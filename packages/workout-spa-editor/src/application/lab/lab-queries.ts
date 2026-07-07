/**
 * Read use cases over the lab stores. Each delegates to an indexed repository
 * read (no full scan). `getLabReport` joins a report with its values (DoD-3);
 * `getLatestValues` derives the latest value PER PARAMETER across the whole
 * history (DoD-4), NOT the latest report — a parameter measured only in an old
 * report still surfaces.
 */
import type { LabReport, LabValue } from "@kaiord/core";

import type { LabRepository } from "../../ports/lab-repository";

export type LabReportDetail = { report: LabReport; values: LabValue[] };

export const getLabValueSeries = (
  labs: LabRepository,
  profileId: string,
  parameterKey: string
): Promise<LabValue[]> => labs.getValueSeries(profileId, parameterKey);

export const listLabReports = (
  labs: LabRepository,
  profileId: string
): Promise<LabReport[]> => labs.listReports(profileId);

export const getLabReport = async (
  labs: LabRepository,
  reportId: string
): Promise<LabReportDetail | undefined> => {
  const report = await labs.getReport(reportId);
  if (!report) return undefined;
  const values = await labs.getValuesByReport(report.profileId, reportId);
  return { report, values };
};

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Ascending by (parameterKey, date, id): iterating and overwriting keeps the
// greatest (date, id) per key as "latest". Same-day ties resolve by the PK
// `id` order — deterministic and stable, NOT temporal (ids carry no time
// component). Sorting in the use case makes both repos agree regardless of
// their storage order.
const byParamThenDateThenId = (a: LabValue, b: LabValue): number =>
  cmp(a.parameterKey, b.parameterKey) || cmp(a.date, b.date) || cmp(a.id, b.id);

/**
 * Reduce a flat value list to the latest value PER PARAMETER. Sorting ascending
 * and overwriting keeps the greatest `(date, id)` per key. Exported so the F3
 * list view can derive latest-per-parameter and the sparkline series from a
 * single `getValuesByProfile` read without re-deriving the tie-break rule.
 */
export const latestByParameter = (values: readonly LabValue[]): LabValue[] => {
  const latestByKey = new Map<string, LabValue>();
  for (const value of [...values].sort(byParamThenDateThenId)) {
    latestByKey.set(value.parameterKey, value);
  }
  return [...latestByKey.values()];
};

export const getLatestValues = async (
  labs: LabRepository,
  profileId: string
): Promise<LabValue[]> =>
  latestByParameter(await labs.getValuesByProfile(profileId));
