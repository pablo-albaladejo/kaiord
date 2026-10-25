import { useCallback } from "react";

import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { useSameSportGate } from "../session-move/use-same-sport-gate";
import { useMoveWorkout } from "./use-move-workout";

/** The detail's Move through the same-sport check (design §3.8). */
export function useGatedDetailMove() {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("calendar");
  const gate = useSameSportGate(persistence, useMoveWorkout());
  const { request: gatedRequest } = gate;
  const request = useCallback(
    (workoutId: string, day: string) =>
      void gatedRequest(workoutId, day).catch(() =>
        toast.error(t("reschedule.moveFailed"))
      ),
    [gatedRequest, toast, t]
  );
  return { ...gate, request };
}
