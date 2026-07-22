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

const ISO_DATE_LENGTH = 10;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The report's calendar date, or `null` when neither the test nor its summary
 * carries a resolvable ISO date. `labReportSchema`/`labValueSchema` require a
 * valid `z.iso.date()`, and there is NO runtime schema validation on the lab
 * write path, so an empty/invalid date would otherwise persist as a broken
 * index key — the caller skips the test instead.
 */
const resolveDate = (
  test: WhoopBiomarkerTest,
  summary: WhoopBiomarkerSummary
): string | null => {
  const date = (test.test_date ?? summary.test_date ?? "").slice(
    0,
    ISO_DATE_LENGTH
  );
  return ISO_DATE.test(date) ? date : null;
};

const buildRow = (biomarker: WhoopBiomarker): LabValueRowInput => ({
  parameterKey: resolveWhoopLabParameterKey(
    biomarker.biomarker_name,
    biomarker.biomarker_display_name
  ),
  // Express "no value" as "" rather than the literal string "null": a nullish
  // value is a not-really-measured biomarker, and parseOptionalNumber drops it.
  valueRaw: biomarker.value == null ? "" : String(biomarker.value),
  unitRaw: biomarker.units ?? "",
  refLowRaw: String(biomarker.optimal_range?.lower_endpoint ?? ""),
  refHighRaw: String(biomarker.optimal_range?.upper_endpoint ?? ""),
  refTouched: biomarker.optimal_range != null,
});

export const mapWhoopTestToSubmissionInput = (
  test: WhoopBiomarkerTest,
  summary: WhoopBiomarkerSummary
): WhoopLabSubmissionInput | null => {
  const date = resolveDate(test, summary);
  if (date === null) return null;
  return {
    header: {
      date,
      labName: test.upload_source ?? test.display_name ?? "",
      fasting: "unspecified",
      drawTime: "",
      notes: "",
    },
    rows: measuredBiomarkers(summary).map(buildRow),
  };
};
