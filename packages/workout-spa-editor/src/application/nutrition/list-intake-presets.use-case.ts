/**
 * listIntakePresets — read use case returning every saved intake preset for a
 * profile, ordered by `createdAt` ascending.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { IntakePresetRecord } from "../../types/intake-preset-record";

export type ListIntakePresetsDeps = {
  persistence: PersistencePort;
  profileId: string;
};

export const listIntakePresets = async (
  deps: ListIntakePresetsDeps
): Promise<IntakePresetRecord[]> => {
  const presets = await deps.persistence.intakePresets.getByProfile(
    deps.profileId
  );
  return [...presets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
