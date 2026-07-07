/**
 * deleteLabReport — remove one `LabReport` and every `LabValue` it owns in the
 * SAME transaction (C4). The report is fetched first to recover its
 * `profileId`, which keys the `[profileId+reportId]` value delete. A missing
 * report is a no-op.
 */
import type { LabPersistence } from "./lab-persistence";

export const deleteLabReport = async (
  persistence: LabPersistence,
  reportId: string
): Promise<void> => {
  await persistence.transaction(async () => {
    const report = await persistence.labs.getReport(reportId);
    if (!report) return;
    await persistence.labs.deleteValuesByReport(report.profileId, reportId);
    await persistence.labs.deleteReport(reportId);
  });
};
