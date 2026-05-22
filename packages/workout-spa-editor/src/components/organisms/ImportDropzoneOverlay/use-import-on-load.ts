/**
 * Hook composing the import-success handler for `ImportDropzoneOverlay`.
 *
 * Combines `handleFileLoad` (Zustand store load) with the date-aware
 * persistence + navigation. When `?date=` is absent the persistence
 * branch is skipped — header-entry imports stay non-persisting.
 */

import { useLocation } from "wouter";

import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAppHandlers } from "../../../hooks/useAppHandlers";
import type { KRD } from "../../../types/krd";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { persistImportedWorkout } from "./persist-imported-workout";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TOAST_IMPORT_FAIL_TITLE = "Import failed";
const TOAST_IMPORT_FAIL_DESC =
  "Could not save the imported workout — please retry.";

export function useImportOnLoad(date: string | null) {
  const { handleFileLoad } = useAppHandlers();
  const persistence = usePersistence();
  const [, navigate] = useLocation();
  const toast = useToastContext();

  return (krd: KRD) => {
    handleFileLoad(krd);
    if (!date || !ISO_DATE_REGEX.test(date)) return;
    const sport = getStructuredWorkout(krd)?.sport ?? "cycling";
    void persistence.profiles
      .getActiveId()
      .then(async (profileId) => {
        if (!profileId) return;
        const record = await persistImportedWorkout(persistence, {
          krd,
          date,
          profileId,
          sport,
        });
        navigate(`/workout/${record.id}`);
      })
      .catch(() => {
        toast.error(TOAST_IMPORT_FAIL_TITLE, TOAST_IMPORT_FAIL_DESC);
      });
  };
}
