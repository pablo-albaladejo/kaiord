/**
 * pruneUsageEvents — bound the synced usage log to a retention window. Computes
 * the cutoff yearMonth (`retentionMonths` before now), lists every event whose
 * month sorts strictly before it, and deletes each by id. Deletes flow through
 * the tombstoning `delete(id)` so the removal propagates cross-device and the
 * merged snapshot stays bounded (design D5). Opportunistic and idempotent — an
 * empty or already-pruned log is a no-op.
 */
import type { PersistencePort } from "../../ports/persistence-port";

const DEFAULT_RETENTION_MONTHS = 12;

export type PruneUsageEventsOptions = {
  now?: () => Date;
  retentionMonths?: number;
};

const cutoffYearMonth = (now: Date, retentionMonths: number): string => {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - retentionMonths, 1)
  );
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}`;
};

export const pruneUsageEvents = async (
  persistence: PersistencePort,
  options: PruneUsageEventsOptions = {}
): Promise<void> => {
  const now = options.now ?? (() => new Date());
  const retentionMonths = options.retentionMonths ?? DEFAULT_RETENTION_MONTHS;
  const cutoff = cutoffYearMonth(now(), retentionMonths);
  const stale = await persistence.usageEvents.listOlderThan(cutoff);
  for (const event of stale) {
    await persistence.usageEvents.delete(event.id);
  }
};
