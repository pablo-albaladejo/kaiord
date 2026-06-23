/**
 * useIntakePresets — reactive read of the saved intake presets for a profile,
 * re-running when the intakePresets store changes. Returns `undefined` while
 * loading and when `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { listIntakePresets } from "../../../application/nutrition/list-intake-presets.use-case";
import { usePersistence } from "../../../contexts/persistence-context";
import type { IntakePresetRecord } from "../../../types/intake-preset-record";

export const useIntakePresets = (
  profileId: string | null
): IntakePresetRecord[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<IntakePresetRecord[] | undefined>(() => {
    if (!profileId) return Promise.resolve(undefined);
    return listIntakePresets({ persistence, profileId });
  }, [persistence, profileId]);
};
