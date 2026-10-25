/**
 * The athlete days a sync's coach moves replaced (design §3.9, AC-18), up
 * to three with a count beyond. **Move back** is an ordinary athlete move
 * through the shared flow; a session that can no longer move shows why.
 */
import type { OverriddenSession } from "../../../application/coaching/apply-coach-date-moves";
import type { MoveBackEntry } from "../../../application/read-move-back-entries";
import { useRequestMove } from "../../../contexts/session-move-context";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { weekdayDate } from "../../pages/calendar-day-labels";
import { MOVE_REASON_KEYS } from "../CoachingCard/move-reason-keys";
import { useMoveBackEntries } from "./use-move-back-entries";

const MAX_NAMED = 3;

export type MoveBackListProps = {
  profileId: string;
  overridden: readonly OverriddenSession[];
};

function MoveBackItem({ entry }: { entry: MoveBackEntry }) {
  const t = useTranslate("calendar");
  const tCoaching = useTranslate("coaching");
  const locale = useActiveLocale();
  const requestMove = useRequestMove();
  const athleteDate = weekdayDate(entry.athleteDate, locale);
  const coachDate = weekdayDate(entry.coachDate, locale);
  const { movability } = entry;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>{t("coachMoves.entry", { coachDate, athleteDate })}</span>
      {!movability.movable ? (
        <span className="text-ink-muted">
          {tCoaching(MOVE_REASON_KEYS[movability.reason])}
        </span>
      ) : (
        requestMove && (
          <button
            type="button"
            onClick={() => requestMove(entry.workoutId, entry.athleteDate)}
            className="text-xs text-ink-strong underline underline-offset-2"
          >
            {t("coachMoves.moveBack", { athleteDate })}
          </button>
        )
      )}
    </li>
  );
}

export function MoveBackList({ profileId, overridden }: MoveBackListProps) {
  const t = useTranslate("calendar");
  const entries = useMoveBackEntries(profileId, overridden);
  if (entries.length === 0) return null;
  const more = entries.length - MAX_NAMED;
  return (
    <div className="space-y-1">
      <ul className="space-y-1">
        {entries.slice(0, MAX_NAMED).map((entry) => (
          <MoveBackItem key={entry.workoutId} entry={entry} />
        ))}
      </ul>
      {more > 0 && (
        <p>{t(pluralKey("coachMoves.more", more), { count: more })}</p>
      )}
    </div>
  );
}
