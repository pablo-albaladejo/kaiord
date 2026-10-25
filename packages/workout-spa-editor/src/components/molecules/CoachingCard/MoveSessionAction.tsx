/**
 * **Move to another day** for a matched session (design §3.8): opens the
 * date picker the workout detail uses, proposing the session's day. When
 * the session can't move, the button is disabled and describes why.
 */
import { useId, useState } from "react";

import type {
  Movability,
  NotMovableReason,
} from "../../../application/session-movability";
import { useTranslate } from "../../../i18n/use-translate";
import { ScheduleDateDialog } from "../ScheduleDateDialog";

export type MoveSessionActionProps = {
  date: string;
  /** Both absent outside the calendar's move flow: nothing renders. */
  movability?: Movability;
  onMoveTo?: (date: string) => void;
};

const REASON_KEYS: Record<NotMovableReason, string> = {
  executed: "move.blockedExecuted",
  completed: "move.blockedCompleted",
  projected: "move.blockedProjected",
};

export function MoveSessionAction(props: MoveSessionActionProps) {
  const t = useTranslate("coaching");
  const [open, setOpen] = useState(false);
  const reasonId = useId();
  const { movability, onMoveTo } = props;
  if (!movability || !onMoveTo) return null;
  const reason = movability.movable ? null : REASON_KEYS[movability.reason];
  return (
    <>
      <button
        type="button"
        data-testid="coaching-dialog-move"
        disabled={reason !== null}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => setOpen(true)}
        className="rounded-md border border-edge px-3 py-1 text-sm hover:bg-surface disabled:opacity-50"
      >
        {t("move.action")}
      </button>
      {reason && (
        <p id={reasonId} className="w-full text-right text-xs text-ink-muted">
          {t(reason)}
        </p>
      )}
      <ScheduleDateDialog
        open={open}
        templateName=""
        defaultDate={props.date}
        copy={{
          title: t("move.title"),
          description: t("move.description"),
          confirm: t("move.confirm"),
          cancel: t("move.cancel"),
        }}
        onConfirm={(date) => {
          setOpen(false);
          onMoveTo(date);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
