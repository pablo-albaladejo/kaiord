/**
 * After a sync moved converted workouts to the coach's new dates: how many
 * followed the coach and, only when some did, how many of the athlete's own
 * moves the coach's date replaced. A sync never pushes, so the copy points
 * to sending the week. Not an error surface; only the text is a status.
 * With a profile, it also lists the replaced days with Move back.
 */
import type { CoachDateMoves } from "../../../application/coaching/apply-coach-date-moves";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { MoveBackList } from "./MoveBackList";

export type CoachMoveNoticeProps = {
  moves: CoachDateMoves;
  profileId?: string;
  onDismiss: () => void;
};

export function CoachMoveNotice({
  moves,
  profileId,
  onDismiss,
}: CoachMoveNoticeProps) {
  const t = useTranslate("calendar");
  const moved = moves.coachMoves + moves.overriddenLocalMoves;
  const overridden = moves.overriddenLocalMoves;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-edge-soft bg-surface p-3.5 text-[13px] text-ink-body">
      <div className="flex-1 space-y-2">
        <p role="status">
          {t(pluralKey("coachMoves.moved", moved), { count: moved })}
          {overridden > 0 &&
            ` ${t(pluralKey("coachMoves.overridden", overridden), { count: overridden })}`}{" "}
          {t("coachMoves.sendHint")}
        </p>
        {profileId && moves.overridden.length > 0 && (
          <MoveBackList profileId={profileId} overridden={moves.overridden} />
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink-strong"
      >
        {t("coachMoves.dismiss")}
      </button>
    </div>
  );
}
