/**
 * Provenance bookkeeping shared by the WHOOP labs importer:
 * `existingWhoopExternalIds` reads the dedup set (already-imported test ids)
 * and `stampWhoopSubmissionProvenance` post-stamps a built submission with
 * WHICH WHOOP test (report) and WHICH biomarker within it (value) produced
 * the record — `buildLabReport`/`buildLabValue` only set `provenance.source`.
 */
import { stampProvenance } from "../import/stamp-provenance";
import type { buildLabReportSubmission } from "../lab/build-lab-report-submission";
import type { LabPersistence } from "../lab/lab-persistence";

export const WHOOP_BRIDGE_ID = "whoop-bridge";

export const existingWhoopExternalIds = async (
  persistence: LabPersistence,
  profileId: string
): Promise<Set<string>> => {
  const reports = await persistence.labs.listReports(profileId);
  const ids = reports
    .filter((report) => report.provenance.sourceBridgeId === WHOOP_BRIDGE_ID)
    .map((report) => report.provenance.externalId);
  return new Set(ids.filter((id): id is string => id != null));
};

export const stampWhoopSubmissionProvenance = (
  submission: NonNullable<ReturnType<typeof buildLabReportSubmission>>,
  testId: string
): void => {
  submission.report.provenance = {
    ...submission.report.provenance,
    ...stampProvenance(WHOOP_BRIDGE_ID, testId),
  };
  for (const value of submission.values) {
    value.provenance = {
      ...value.provenance,
      ...stampProvenance(WHOOP_BRIDGE_ID, `${testId}:${value.parameterKey}`),
    };
  }
};
