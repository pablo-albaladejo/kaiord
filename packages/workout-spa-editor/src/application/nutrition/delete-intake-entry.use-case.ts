/**
 * deleteIntakeEntry — removes one logged intake entry by id. The day's
 * roll-up recomputes downstream from the remaining entries.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export type DeleteIntakeEntryDeps = {
  persistence: PersistencePort;
};

export const deleteIntakeEntry = async (
  deps: DeleteIntakeEntryDeps,
  id: string
): Promise<void> => {
  await deps.persistence.intakeEntries.delete(id);
};
