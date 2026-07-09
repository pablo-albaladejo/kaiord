/**
 * buildLabReportSubmission — combine the form header + N rows into one
 * savable `{report, values}` pair, or `undefined` when every row was blank
 * (nothing usable to save). Each value gets its own id via `ctx.newId`.
 */
import type { BiologicalSex, LabReport, LabValue } from "@kaiord/core";

import {
  buildLabReport,
  type LabProvenanceSource,
  type LabReportHeaderInput,
} from "./build-lab-report";
import { buildLabValue, type LabValueRowInput } from "./build-lab-value";

export type LabReportSubmission = { report: LabReport; values: LabValue[] };

export type BuildSubmissionContext = {
  profileId: string;
  reportId: string;
  sex?: BiologicalSex;
  newId: () => string;
  provenance?: LabProvenanceSource;
};

export function buildLabReportSubmission(
  header: LabReportHeaderInput,
  rows: readonly LabValueRowInput[],
  ctx: BuildSubmissionContext
): LabReportSubmission | undefined {
  const values = rows
    .map((row) =>
      buildLabValue(row, {
        id: ctx.newId(),
        profileId: ctx.profileId,
        reportId: ctx.reportId,
        date: header.date,
        sex: ctx.sex,
        provenance: ctx.provenance,
      })
    )
    .filter((value): value is LabValue => value !== undefined);
  if (values.length === 0) return undefined;

  const report = buildLabReport(header, {
    id: ctx.reportId,
    profileId: ctx.profileId,
    provenance: ctx.provenance,
  });
  return { report, values };
}
