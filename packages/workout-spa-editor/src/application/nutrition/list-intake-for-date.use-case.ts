/**
 * listIntakeForDate — read use case returning every logged intake entry for a
 * (profile, date), ordered by `loggedAt` ascending so the UI shows the day's
 * meals in logging order.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { IntakeEntryRecord } from "../../types/intake-entry-record";

export type ListIntakeForDateDeps = {
  persistence: PersistencePort;
  profileId: string;
};

export const listIntakeForDate = async (
  deps: ListIntakeForDateDeps,
  date: string
): Promise<IntakeEntryRecord[]> => {
  const entries = await deps.persistence.intakeEntries.getByProfileAndDate(
    deps.profileId,
    date
  );
  return [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
};
