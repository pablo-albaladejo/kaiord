import type { PointerEvent } from "react";

import { isMovableSession } from "../../../application/session-movability";
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CalendarView } from "../../../types/user-preferences";
import { MatchedSessionCard } from "../MatchedSessionCard/MatchedSessionCard";
import { DRAGGABLE_CARD } from "./draggable-card";

export type MatchedCardsProps = {
  sessions: MatchedSessionWithMetadata[];
  view: CalendarView;
  density: "compact" | "comfortable";
  onActivityClick?: (activity: CoachingActivity) => void;
  bindCardDrag?: (workoutId: string) => (event: PointerEvent) => void;
  /** The week's executed refs: a matched plan listed here is a recording. */
  executedRefIds?: ReadonlySet<string>;
};

/**
 * A movable session's card carries the drag binding, keyed by its workout
 * id (design §3.8). A done or projected session gets none: its dialog says
 * why it can't move.
 */
export const renderMatchedCards = (p: MatchedCardsProps) =>
  p.sessions.map((s) => {
    const card = (
      <MatchedSessionCard
        key={s.match.id}
        session={s}
        view={p.view}
        density={p.density}
        onClick={p.onActivityClick}
      />
    );
    const recorded = p.executedRefIds?.has(s.workout.id) ?? false;
    if (!p.bindCardDrag || !isMovableSession({ ...s, recorded }).movable)
      return card;
    return (
      <div
        key={s.match.id}
        className={DRAGGABLE_CARD}
        onPointerDown={p.bindCardDrag(s.workout.id)}
      >
        {card}
      </div>
    );
  });
