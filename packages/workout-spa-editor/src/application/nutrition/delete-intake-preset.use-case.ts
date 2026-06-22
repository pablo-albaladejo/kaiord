/**
 * deleteIntakePreset — removes one saved intake preset by id. Already-logged
 * entries created from it are unaffected (a preset is only a template).
 */
import type { PersistencePort } from "../../ports/persistence-port";

export type DeleteIntakePresetDeps = {
  persistence: PersistencePort;
};

export const deleteIntakePreset = async (
  deps: DeleteIntakePresetDeps,
  id: string
): Promise<void> => {
  await deps.persistence.intakePresets.delete(id);
};
