/**
 * Hook composing the import-success handler for `ImportDropzoneOverlay`.
 *
 * Dispatches on `krd.type`:
 *  - health-domain KRDs are routed through `importHealthFitFile` and
 *    the user is sent to the matching Health Hub page; the workout
 *    store is NOT touched.
 *  - workout-type KRDs keep the existing flow (`handleFileLoad` +
 *    optional date-aware persistence + navigation).
 */

import { isHealthFileType } from "@kaiord/core";
import { useLocation } from "wouter";

import {
  importHealthFitFile,
  UnsupportedHealthKrdError,
} from "../../../application/health/import-health-fit-file.use-case";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAppHandlers } from "../../../hooks/use-app-handlers";
import { parseBackOrigin } from "../../../routing/back-origin";
import { withOrigin } from "../../../routing/with-origin";
import type { KRD } from "../../../types/krd";
import { isValidCalendarDate } from "../../../utils/is-valid-calendar-date";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { healthDestinationFor } from "./health-destination";
import { persistImportedWorkout } from "./persist-imported-workout";

const TOAST_IMPORT_FAIL_TITLE = "Import failed";
const TOAST_IMPORT_FAIL_DESC =
  "Could not save the imported workout — please retry.";
const TOAST_HEALTH_FAIL_TITLE = "Health import failed";
const TOAST_HEALTH_FAIL_DESC =
  "Could not save the imported health record — please retry.";

export function useImportOnLoad(date: string | null, from: string | null) {
  const { handleFileLoad } = useAppHandlers();
  const persistence = usePersistence();
  const [, navigate] = useLocation();
  const toast = useToastContext();

  return (krd: KRD) => {
    if (isHealthFileType(krd.type)) {
      void persistence.profiles
        .getActiveId()
        .then(async (profileId) => {
          if (!profileId) return;
          await importHealthFitFile({ persistence, profileId }, krd);
          navigate(healthDestinationFor(krd.type));
        })
        .catch((error) => {
          if (error instanceof UnsupportedHealthKrdError) return;
          toast.error(TOAST_HEALTH_FAIL_TITLE, TOAST_HEALTH_FAIL_DESC);
        });
      return;
    }
    handleFileLoad(krd);
    if (!date || !isValidCalendarDate(date)) return;
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
        navigate(
          withOrigin(
            `/workout/${record.id}`,
            parseBackOrigin(from) ?? "calendar"
          )
        );
      })
      .catch(() => {
        toast.error(TOAST_IMPORT_FAIL_TITLE, TOAST_IMPORT_FAIL_DESC);
      });
  };
}
