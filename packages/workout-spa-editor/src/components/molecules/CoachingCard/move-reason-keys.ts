import type { NotMovableReason } from "../../../application/session-movability";

/** Coaching-namespace copy for why a session can't move. */
export const MOVE_REASON_KEYS: Record<NotMovableReason, string> = {
  executed: "move.blockedExecuted",
  completed: "move.blockedCompleted",
  projected: "move.blockedProjected",
};
