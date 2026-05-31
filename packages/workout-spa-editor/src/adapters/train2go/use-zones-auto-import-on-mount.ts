/**
 * useZonesAutoImportOnMount — fires the Train2Go zones import once per
 * SPA mount when the active profile qualifies (see `maybeAutoImportZones`).
 *
 * Idempotent: `syncZones` upserts by natural key and a per-profile ref
 * guards re-fires across re-renders, so the import runs at most once per
 * profile per mount.
 */
import { useEffect, useRef } from "react";

import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import type { PersistencePort } from "../../ports/persistence-port";
import { maybeAutoImportZones } from "./zones-auto-import";

export const useZonesAutoImportOnMount = (
  persistence: PersistencePort,
  runImport: (profileId: string) => Promise<void>
): void => {
  const live = useActiveProfileLive();
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    const profileId = live?.id ?? null;
    const profile = live?.profile ?? null;
    if (!profileId || !profile || firedFor.current === profileId) return;
    firedFor.current = profileId;
    void maybeAutoImportZones(persistence, profile, profileId, runImport);
  }, [live, persistence, runImport]);
};
