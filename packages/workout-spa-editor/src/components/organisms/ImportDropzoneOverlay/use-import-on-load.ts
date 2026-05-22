/**
 * Hook composing the import-success handler for `ImportDropzoneOverlay`.
 *
 * Combines `handleFileLoad` (Zustand store load) with the date-aware
 * persistence + navigation. When `?date=` is absent the persistence
 * branch is skipped — header-entry imports stay non-persisting.
 */

import { useLocation } from "wouter";

import { usePersistence } from "../../../contexts/persistence-context";
import { useAppHandlers } from "../../../hooks/useAppHandlers";
import type { KRD } from "../../../types/krd";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { persistImportedWorkout } from "./persist-imported-workout";

export function useImportOnLoad(date: string | null) {
  const { handleFileLoad } = useAppHandlers();
  const persistence = usePersistence();
  const [, navigate] = useLocation();

  return (krd: KRD) => {
    handleFileLoad(krd);
    if (!date) return;
    const sport = getStructuredWorkout(krd)?.sport ?? "cycling";
    void persistence.profiles.getActiveId().then((profileId) => {
      if (!profileId) return;
      return persistImportedWorkout(persistence, {
        krd,
        date,
        profileId,
        sport,
      }).then((record) => {
        navigate(`/workout/${record.id}`);
      });
    });
  };
}
