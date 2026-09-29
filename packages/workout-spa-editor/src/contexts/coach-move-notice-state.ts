/**
 * The coach-move notice (spa-coaching-integration "Coach-move notice"): the
 * last sync result with moves, per profile and week, and which result the
 * athlete dismissed. Session-only: a later sync with new moves bumps `seq`,
 * so a dismissed notice shows again; a sync with 0 moves changes nothing.
 */
import type { CoachDateMoves } from "../application/coaching/apply-coach-date-moves";

type WeekNotice = CoachDateMoves & { seq: number };

export type CoachMoveNotices = {
  notices: Record<string, WeekNotice>;
  dismissed: Record<string, number>;
};

export const NO_NOTICES: CoachMoveNotices = { notices: {}, dismissed: {} };

const noticeKey = (profileId: string, weekStart: string) =>
  `${profileId}:${weekStart}`;

export const reportMoves = (
  s: CoachMoveNotices,
  profileId: string,
  weekStart: string,
  moves: CoachDateMoves
): CoachMoveNotices => {
  if (moves.coachMoves + moves.overriddenLocalMoves === 0) return s;
  const key = noticeKey(profileId, weekStart);
  const seq = (s.notices[key]?.seq ?? 0) + 1;
  const { coachMoves, overriddenLocalMoves } = moves;
  return {
    ...s,
    notices: { ...s.notices, [key]: { coachMoves, overriddenLocalMoves, seq } },
  };
};

export const dismissMoves = (
  s: CoachMoveNotices,
  profileId: string,
  weekStart: string
): CoachMoveNotices => {
  const key = noticeKey(profileId, weekStart);
  const seq = s.notices[key]?.seq ?? 0;
  return { ...s, dismissed: { ...s.dismissed, [key]: seq } };
};

/** The notice to show for a week, or `undefined` once dismissed. */
export const visibleMoves = (
  s: CoachMoveNotices,
  profileId: string | null,
  weekStart: string
): CoachDateMoves | undefined => {
  if (!profileId) return undefined;
  const key = noticeKey(profileId, weekStart);
  const notice = s.notices[key];
  return notice && s.dismissed[key] !== notice.seq ? notice : undefined;
};
