/**
 * One workout of a bulk run: its date, a link to its page (where an
 * `uncertain` or `duplicate-left` entry is answered) and its status.
 */
import { Link } from "wouter";

import type { BulkOutcome } from "../../../application/garmin-bulk/send-week-to-garmin";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { type Translate, useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";
import { isPaceZonesReason } from "../../../utils/pace-zones-unavailable-error";
import { formatDateLabel } from "../../molecules/TemplatePickerDialog/format-date-label";
import { type SendWeekTone, statusTone } from "./send-week-status";

const TONE_CLASS: Record<SendWeekTone, string> = {
  plain: "text-ink-muted",
  warning: "text-ink-strong",
  danger: "text-[var(--danger-text)]",
};

/** Why an item was not sent, when the athlete can act on it. */
const reasonOf = (outcome: BulkOutcome, t: Translate): string => {
  if (outcome.notEligible)
    return ` (${t(`sendWeek.notEligible.${outcome.notEligible}`)})`;
  const { result } = outcome;
  return result?.kind === "failed" && isPaceZonesReason(result.reason)
    ? ` (${t(`sendWeek.paceZones.${result.reason}`)})`
    : "";
};

export function SendWeekItem({
  outcome,
  weekId,
}: {
  outcome: BulkOutcome;
  weekId: string;
}) {
  const t = useTranslate("calendar");
  const locale = useActiveLocale();
  const reason = reasonOf(outcome, t);
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
