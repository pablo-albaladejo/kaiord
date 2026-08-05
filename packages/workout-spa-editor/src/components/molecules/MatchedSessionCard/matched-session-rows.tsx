/**
 * Per-density row renderers for MatchedSessionCard. Kept separate from
 * the component file so the JSX-heavy parts don't push the top-level
 * component over the per-file line cap.
 *
 * The compliance percentage is not repeated here — it is the chip in the
 * title row, and stating it twice on one card made the metadata row read as
 * two different numbers.
 */

import { deriveWorkoutLifecycle } from "../WorkoutCard/session-lifecycle";
import { SessionLifecycleBadges } from "../WorkoutCard/SessionLifecycleBadges";
import {
  actualDurationText,
  actualTitle,
  type MatchedSession,
  planDurationText,
} from "./matched-session-text";

const lifecycleOf = (s: MatchedSession) =>
  deriveWorkoutLifecycle(s.workout, s.executed?.length ?? 0);

export const renderTitleRow = (s: MatchedSession) => (
  <>
    <span role="img" aria-label={s.activity.sport.label}>
      {s.activity.sport.icon}
    </span>
    <span className="min-w-0 flex-1">{actualTitle(s)}</span>
  </>
);

export const renderComfortableMetadata = (s: MatchedSession) => (
  <>
    <span className="text-[10px] text-ink-muted">Plan ·</span>
    <span>{planDurationText(s)}</span>
    <SessionLifecycleBadges flags={lifecycleOf(s)} />
  </>
);

export const renderComfortableSecondary = (s: MatchedSession) => (
  <>
    <span className="text-[10px] text-ink-muted">Actual ·</span>
    <span>{actualDurationText(s)}</span>
  </>
);

export const renderCompactMetadata = (s: MatchedSession) => (
  <>
    <span>{actualDurationText(s)}</span>
    <SessionLifecycleBadges flags={lifecycleOf(s)} />
  </>
);
