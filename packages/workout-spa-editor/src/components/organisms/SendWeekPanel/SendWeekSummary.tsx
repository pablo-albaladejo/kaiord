/**
 * The run's summary: placed, library-only (warning tone, apart from the
 * failures) and needing attention, plus ONE notice per run for an outdated
 * extension: the Update notice every other surface shows, with its one fix.
 */
import type { BulkOutcome } from "../../../application/garmin-bulk/send-week-to-garmin";
import { useTranslate } from "../../../i18n/use-translate";
import { GarminConnectionNotice } from "../../molecules/ConnectionNotice/GarminConnectionNotice";
import { hasOutdatedBridge, summarize } from "./send-week-status";

export function SendWeekSummary({
  outcomes,
}: {
  outcomes: readonly BulkOutcome[];
}) {
  const t = useTranslate("calendar");
  const counts = summarize(outcomes);
  return (
    <div className="flex flex-col gap-1 text-xs">
      <p className="flex flex-wrap gap-x-3">
        <span className="text-ink-muted">
          {t("sendWeek.summary.placed", { count: counts.placed })}
        </span>
        {counts.libraryOnly > 0 && (
          <span className="text-ink-strong">
            {t("sendWeek.summary.libraryOnly", { count: counts.libraryOnly })}
          </span>
        )}
        {counts.attention > 0 && (
          <span className="text-[var(--danger-text)]">
            {t("sendWeek.summary.attention", { count: counts.attention })}
          </span>
        )}
      </p>
      {hasOutdatedBridge(outcomes) && (
        <GarminConnectionNotice
          connection="outdated"
          testId="send-week-outdated"
        />
      )}
    </div>
  );
}
