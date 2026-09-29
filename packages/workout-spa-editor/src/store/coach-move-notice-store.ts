/**
 * The coach-move notice (spa-coaching-integration "Coach-move notice"): the
 * last sync result with moves, per profile and week, and which result the
 * athlete dismissed. Session-only: a later sync with new moves bumps `seq`,
 * so a dismissed notice shows again; a sync with 0 moves changes nothing.
 */
import { create } from "zustand";

import type { CoachDateMoves } from "../application/coaching/apply-coach-date-moves";

type WeekNotice = CoachDateMoves & { seq: number };

type CoachMoveNoticeState = {
  notices: Record<string, WeekNotice>;
  dismissed: Record<string, number>;
  report: (profileId: string, weekStart: string, moves: CoachDateMoves) => void;
  dismiss: (profileId: string, weekStart: string) => void;
};

export const noticeKey = (profileId: string, weekStart: string) =>
  `${profileId}:${weekStart}`;

export const useCoachMoveNoticeStore = create<CoachMoveNoticeState>((set) => ({
  notices: {},
  dismissed: {},
  report: (profileId, weekStart, moves) => {
    if (moves.coachMoves + moves.overriddenLocalMoves === 0) return;
    const key = noticeKey(profileId, weekStart);
    set((s) => ({
      notices: {
        ...s.notices,
        [key]: {
          coachMoves: moves.coachMoves,
          overriddenLocalMoves: moves.overriddenLocalMoves,
          seq: (s.notices[key]?.seq ?? 0) + 1,
        },
      },
    }));
  },
  dismiss: (profileId, weekStart) => {
    const key = noticeKey(profileId, weekStart);
    set((s) => ({
      dismissed: { ...s.dismissed, [key]: s.notices[key]?.seq ?? 0 },
    }));
  },
}));

/** The notice to show for a week, or `undefined` once dismissed. */
export const useCoachMoveNotice = (
  profileId: string | null,
  weekStart: string
): CoachDateMoves | undefined =>
  useCoachMoveNoticeStore((s) => {
    if (!profileId) return undefined;
    const key = noticeKey(profileId, weekStart);
    const notice = s.notices[key];
    return notice && s.dismissed[key] !== notice.seq ? notice : undefined;
  });
