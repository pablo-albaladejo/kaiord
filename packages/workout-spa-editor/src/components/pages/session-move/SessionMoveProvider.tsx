/**
 * The one move flow behind every calendar entry point (design §3.8): Grid
 * drag, the coaching dialog's Move and the coach-move notice's Move back.
 * Each asks `useRequestMove()` (`contexts/session-move-context`); it runs the same-sport check,
 * then `moveSession`, and shows the prompt and the toasts.
 */
import { type ReactNode, useCallback } from "react";

import { usePersistence } from "../../../contexts/persistence-context";
import {
  type RequestMove,
  SessionMoveContext,
} from "../../../contexts/session-move-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { useGridMove } from "../calendar-dnd/use-grid-move";
import { SameSportPrompt } from "./SameSportPrompt";
import { useSameSportGate } from "./use-same-sport-gate";

export function SessionMoveProvider({ children }: { children: ReactNode }) {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("calendar");
  const move = useGridMove(useCallback(() => persistence, [persistence]));
  const gate = useSameSportGate(persistence, move);
  const { request } = gate;
  const requestMove = useCallback<RequestMove>(
    (workoutId, day) =>
      void request(workoutId, day).catch(() =>
        toast.error(t("reschedule.moveFailed"))
      ),
    [request, toast, t]
  );
  return (
    <SessionMoveContext.Provider value={requestMove}>
      {children}
      <SameSportPrompt
        pending={gate.pending}
        onConfirm={gate.confirm}
        onCancel={gate.cancel}
      />
    </SessionMoveContext.Provider>
  );
}
