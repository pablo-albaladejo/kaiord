/**
 * deleteLabReport — remove one `LabReport` and every `LabValue` it owns in the
 * SAME transaction (C4). The report is fetched first to recover its
 * `profileId`, which keys the `[profileId+reportId]` value delete. A missing
 * report is a no-op.
 *
 * Both stores ride the cloud snapshot but neither is reachable from the
 * `withTombstones` decorator (the repo deletes are `deleteReport` /
 * `deleteValuesByReport`, not a single-arg `delete(id)`), so this user-intent
 * delete records its own `[labReports+id]` and `[labValues+id]` tombstones —
 * the same precedent `deleteConversation` sets. Without them the report
 * reappears on the next merge, on the deleting device included.
 */
import type { LabPersistence } from "./lab-persistence";

export const deleteLabReport = async (
  persistence: LabPersistence,
  reportId: string,
  now: () => Date = () => new Date()
): Promise<void> => {
  await persistence.transaction(async () => {
    const report = await persistence.labs.getReport(reportId);
    if (!report) return;
    const { profileId } = report;
    const values = await persistence.labs.getValuesByReport(
      profileId,
      reportId
    );
    await persistence.labs.deleteValuesByReport(profileId, reportId);
    await persistence.labs.deleteReport(reportId);
    const deletedAt = now().toISOString();
    for (const value of values) {
      await persistence.tombstones.put({
        table: "labValues",
        id: value.id,
        deletedAt,
        profileId,
      });
    }
    await persistence.tombstones.put({
      table: "labReports",
      id: reportId,
      deletedAt,
      profileId,
    });
  });
};
