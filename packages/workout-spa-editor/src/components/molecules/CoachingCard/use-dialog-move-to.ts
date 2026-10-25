import { useMemo } from "react";

import { useRequestMove } from "../../../contexts/session-move-context";

/**
 * The dialog's Move: closes the dialog, then hands the matched workout to
 * the calendar's move flow, whose same-sport prompt and toasts outlive the
 * dialog. `undefined` with no matched workout or outside the flow.
 */
export function useDialogMoveTo(
  workoutId: string | null,
  onClose: () => void
): ((date: string) => void) | undefined {
  const requestMove = useRequestMove();
  return useMemo(() => {
    if (!requestMove || !workoutId) return undefined;
    return (date: string) => {
      onClose();
      requestMove(workoutId, date);
    };
  }, [requestMove, workoutId, onClose]);
}
