/**
 * The run's summary: placed, library-only (warning tone, apart from the
 * failures) and needing attention, plus ONE notice per run for an outdated
 * bridge with the action that opens the extension's store page.
 */
import type { BulkOutcome } from "../../../application/garmin-bulk/send-week-to-garmin";
import { useTranslate } from "../../../i18n/use-translate";
import { AttentionMark } from "../../atoms/AttentionMark";
import { GARMIN_BRIDGE_STORE_URL } from "../../molecules/GarminPushButton/PlacementFeedback";
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
        <p className="flex flex-wrap items-center gap-2 text-ink-strong">
          <AttentionMark size="xs" />
          <span>{t("sendWeek.outdated")}</span>
          <a
            className="underline"
            href={GARMIN_BRIDGE_STORE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t("sendWeek.updateExtension")}
          </a>
        </p>
      )}
    </div>
  );
}
