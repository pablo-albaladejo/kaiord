/**
 * The coach-move notice's session state, held above the routes so a sync
 * run from any page reaches the calendar (see `coach-move-notice-state`).
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { CoachDateMoves } from "../application/coaching/apply-coach-date-moves";
import {
  type CoachMoveNotices,
  dismissMoves,
  NO_NOTICES,
  reportMoves,
  visibleMoves,
} from "./coach-move-notice-state";

type Actions = {
  report: (profileId: string, weekStart: string, moves: CoachDateMoves) => void;
  dismiss: (profileId: string, weekStart: string) => void;
};

const CoachMoveNoticeContext = createContext<
  (Actions & { state: CoachMoveNotices }) | null
>(null);

export const CoachMoveNoticeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState(NO_NOTICES);
  const report = useCallback<Actions["report"]>(
    (profileId, weekStart, moves) =>
      setState((s) => reportMoves(s, profileId, weekStart, moves)),
    []
  );
  const dismiss = useCallback<Actions["dismiss"]>(
    (profileId, weekStart) =>
      setState((s) => dismissMoves(s, profileId, weekStart)),
    []
  );
  const value = useMemo(
    () => ({ state, report, dismiss }),
    [state, report, dismiss]
  );
  return (
    <CoachMoveNoticeContext.Provider value={value}>
      {children}
    </CoachMoveNoticeContext.Provider>
  );
};

const NO_ACTIONS: Actions = { report: () => {}, dismiss: () => {} };

/** Reports and dismisses; a no-op outside the provider. */
export const useCoachMoveNoticeActions = (): Actions =>
  useContext(CoachMoveNoticeContext) ?? NO_ACTIONS;

/** The notice to show for a week, or `undefined` once dismissed. */
export const useCoachMoveNotice = (
  profileId: string | null,
  weekStart: string
): CoachDateMoves | undefined => {
  const ctx = useContext(CoachMoveNoticeContext);
  return ctx ? visibleMoves(ctx.state, profileId, weekStart) : undefined;
};
