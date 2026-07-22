/**
 * importOneWhoopLabTest — fetch one WHOOP biomarker test's summary, map it
 * to a `buildLabReportSubmission` input, and save the result. Returns a
 * discriminated outcome so the orchestrating loop in
 * `import-whoop-labs.use-case.ts` can tally imported/skipped counts or abort
 * the whole import on a transport/parse error.
 */
import {
  whoopBiomarkerSummarySchema,
  type WhoopBiomarkerTest,
} from "@kaiord/whoop";

import { buildLabReportSubmission } from "../lab/build-lab-report-submission";
import { saveLabReport } from "../lab/save-lab-report.use-case";
import { mapWhoopTestToSubmissionInput } from "./map-whoop-biomarker-test";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import type { ImportWhoopLabsDeps } from "./whoop-lab-import-types";
import { stampWhoopSubmissionProvenance } from "./whoop-lab-provenance";

export const TESTS_PATH = "/advanced-labs-service/v1/biomarker-tests";
const summaryPath = (testId: string): string =>
  `${TESTS_PATH}/${testId}/summary`;

export type TestOutcome =
  | { kind: "imported" }
  | { kind: "skipped" }
  | { kind: "error"; error?: string };

export const importOneWhoopLabTest = async (
  deps: ImportWhoopLabsDeps,
  test: WhoopBiomarkerTest,
  existingIds: ReadonlySet<string>
): Promise<TestOutcome> => {
  const testId = test.id == null ? "" : String(test.id);
  if (!testId || existingIds.has(testId)) return { kind: "skipped" };

  let fetched: WhoopFetchResult;
  try {
    fetched = await deps.fetchLabs(summaryPath(testId));
  } catch (err) {
    return {
      kind: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!fetched.ok) return { kind: "error", error: fetched.error };
  const parsed = whoopBiomarkerSummarySchema.safeParse(fetched.data);
  if (!parsed.success) {
    return { kind: "error", error: "Malformed WHOOP biomarker summary" };
  }

  const input = mapWhoopTestToSubmissionInput(test, parsed.data);
  if (input === null) return { kind: "skipped" };
  const { header, rows } = input;
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const submission = buildLabReportSubmission(header, rows, {
    profileId: deps.profileId,
    reportId: newId(),
    newId,
    provenance: "whoop",
    sex: deps.sex,
  });
  if (!submission) return { kind: "skipped" };

  stampWhoopSubmissionProvenance(submission, testId);
  await saveLabReport(deps.persistence, submission.report, submission.values);
  return { kind: "imported" };
};
