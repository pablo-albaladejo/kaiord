/**
 * mapWhoopTestToSubmissionInput — turn one WHOOP biomarker test plus its
 * summary into `buildLabReportSubmission`'s inputs: a report header and one
 * `LabValueRowInput` per biomarker WHOOP actually measured
 * (`measuredBiomarkers` drops the `UNAVAILABLE` catalog entries). Only
 * `optimal_range` seeds the reference bounds — `sufficient_range` and
 * `out_of_range` are WHOOP-specific bands with no KAIORD equivalent.
 */
import {
  measuredBiomarkers,
  type WhoopBiomarker,
  type WhoopBiomarkerSummary,
  type WhoopBiomarkerTest,
} from "@kaiord/whoop";

import type { LabReportHeaderInput } from "../lab/build-lab-report";
import type { LabValueRowInput } from "../lab/build-lab-value";
import { resolveWhoopLabParameterKey } from "./resolve-whoop-lab-parameter-key";

export type WhoopLabSubmissionInput = {
  header: LabReportHeaderInput;
  rows: LabValueRowInput[];
};

const buildHeader = (
  test: WhoopBiomarkerTest,
  summary: WhoopBiomarkerSummary
): LabReportHeaderInput => ({
  date: (test.test_date ?? summary.test_date ?? "").slice(0, 10),
  labName: test.upload_source ?? test.display_name ?? "",
  fasting: "unspecified",
  drawTime: "",
  notes: "",
});

const buildRow = (biomarker: WhoopBiomarker): LabValueRowInput => ({
  parameterKey: resolveWhoopLabParameterKey(
    biomarker.biomarker_name,
    biomarker.biomarker_display_name
  ),
  valueRaw: String(biomarker.value),
  unitRaw: biomarker.units ?? "",
  refLowRaw: String(biomarker.optimal_range?.lower_endpoint ?? ""),
  refHighRaw: String(biomarker.optimal_range?.upper_endpoint ?? ""),
  refTouched: biomarker.optimal_range != null,
});

export const mapWhoopTestToSubmissionInput = (
  test: WhoopBiomarkerTest,
  summary: WhoopBiomarkerSummary
): WhoopLabSubmissionInput => ({
  header: buildHeader(test, summary),
  rows: measuredBiomarkers(summary).map(buildRow),
});
