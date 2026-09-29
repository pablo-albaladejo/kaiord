/**
 * One workout of a bulk run: its date, a link to its page (where an
 * `uncertain` or `duplicate-left` entry is answered) and its status.
 */
import { Link } from "wouter";

import type { BulkOutcome } from "../../../application/garmin-bulk/send-week-to-garmin";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";
import { formatDateLabel } from "../../molecules/TemplatePickerDialog/format-date-label";
import { type SendWeekTone, statusTone } from "./send-week-status";

/** Failures only the athlete can fix, so their cause is spelled out. */
const EXPLAINED_FAILURES: ReadonlySet<string> = new Set([
  "missing-ftp",
  "sport-without-power-zones",
]);

const explainedFailure = (outcome: BulkOutcome): string | undefined =>
  outcome.result?.kind === "failed" &&
  EXPLAINED_FAILURES.has(outcome.result.reason)
    ? outcome.result.reason
    : undefined;

const TONE_CLASS: Record<SendWeekTone, string> = {
  plain: "text-ink-muted",
  warning: "text-ink-strong",
  danger: "text-[var(--danger-text)]",
};

export function SendWeekItem({
  outcome,
  weekId,
}: {
  outcome: BulkOutcome;
  weekId: string;
}) {
  const t = useTranslate("calendar");
  const detail = useTranslate("workout-detail");
  const locale = useActiveLocale();
  const failure = explainedFailure(outcome);
  const reason = outcome.notEligible
    ? ` (${t(`sendWeek.notEligible.${outcome.notEligible}`)})`
    : failure
      ? ` (${detail(`placement.failed.${failure}`)})`
      : "";
  return (
    <li className="flex items-center justify-between gap-3">
      <Link
        className="underline underline-offset-2"
        href={withOrigin(`/workout/${outcome.workoutId}`, "calendar", {
          week: weekId,
        })}
      >
        {formatDateLabel(outcome.date, locale)}
      </Link>
      <span className={TONE_CLASS[statusTone(outcome.status)]}>
        {t(`sendWeek.status.${outcome.status}`)}
        {reason}
      </span>
    </li>
  );
}
