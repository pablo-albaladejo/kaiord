import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";

import { policyRepo } from "../integration-policy-repo";

const TRAINING_ZONES = "training-zones" as const;

export type ZonesAutoImport = {
  /** At least one source can send zones, so the control has something to govern. */
  available: boolean;
  /** True when a source is allowed to overwrite these numbers unasked. */
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
};

/**
 * The switch behind "let a connected source update these numbers".
 *
 * Reads and writes the `mode` of the profile's
 * `(training-zones, import)` policies — the same predicate
 * `hasEnabledAutoImportZonesPolicy` gates the zones-import lifecycle on, so
 * the control and the mechanism cannot drift apart.
 *
 * `enabled` is left alone: turning this off means "never overwrite what I
 * typed", not "stop importing zones at all" — an import the user asks for
 * explicitly still runs.
 */
export function useZonesAutoImport(profileId: string): ZonesAutoImport {
  const policies = useLiveQuery(
    () =>
      policyRepo.findByProfileDirection({
        profileId,
        dataType: TRAINING_ZONES,
        direction: "import",
      }),
    [profileId]
  );

  const setEnabled = useCallback(
    async (next: boolean) => {
      const current = await policyRepo.findByProfileDirection({
        profileId,
        dataType: TRAINING_ZONES,
        direction: "import",
      });
      const now = new Date().toISOString();
      const mode = next ? "auto" : "manual";
      for (const policy of current) {
        if (policy.mode === mode) continue;
        await policyRepo.put({ ...policy, mode, updatedAt: now });
      }
    },
    [profileId]
  );

  return {
    available: (policies?.length ?? 0) > 0,
    enabled: (policies ?? []).some((p) => p.enabled && p.mode === "auto"),
    setEnabled,
  };
}
