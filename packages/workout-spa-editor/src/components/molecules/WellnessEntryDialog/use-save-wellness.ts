/**
 * use-save-wellness — UI hook bridging the wellness form to the
 * `saveManualHealthMetric` application use case.
 *
 * Persists EVERY filled metric inside ONE awaited pass: each metric
 * writes its own Dexie table (persistence-port.ts:78-83), so the
 * distinct metrics in a single submit never race one another.
 *
 * Owns the single in-flight submit lock (`useRef` set synchronously
 * before the first `await`): a re-entrant `submit(...)` while the one
 * promise is pending is ignored, closing the un-awaited same-metric
 * race. `isSaving` mirrors the lock for the disabled Save button.
 */
import { useRef, useState } from "react";

import type { ManualHealthMetric } from "../../../application/health/manual-health-metric";
import { saveManualHealthMetric } from "../../../application/health/save-manual-health-metric.use-case";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";

const TOAST_WELLNESS_SAVED = "Wellness saved";
const TOAST_WELLNESS_SAVE_FAILED = "Could not save — please retry";

export type WellnessValues = Partial<Record<ManualHealthMetric, number>>;

export type UseSaveWellnessResult = {
  submit: (values: WellnessValues) => Promise<boolean>;
  isSaving: boolean;
};

export function useSaveWellness(day: string): UseSaveWellnessResult {
  const persistence = usePersistence();
  const toast = useToastContext();
  const inFlight = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (values: WellnessValues): Promise<boolean> => {
    if (inFlight.current) return false;
    const entries = Object.entries(values) as [ManualHealthMetric, number][];
    if (entries.length === 0) return false;
    inFlight.current = true;
    setIsSaving(true);
    try {
      const profileId = await persistence.profiles.getActiveId();
      if (!profileId) {
        toast.error(TOAST_WELLNESS_SAVE_FAILED);
        return false;
      }
      let savedCount = 0;
      for (const [metric, value] of entries) {
        const result = await saveManualHealthMetric(
          { persistence, profileId },
          { metric, day, value }
        );
        if (result) savedCount += 1;
      }
      if (savedCount === 0) {
        toast.error(TOAST_WELLNESS_SAVE_FAILED);
        return false;
      }
      toast.success(TOAST_WELLNESS_SAVED);
      return true;
    } catch {
      toast.error(TOAST_WELLNESS_SAVE_FAILED);
      return false;
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  return { submit, isSaving };
}
