/**
 * The bulk "Send week" panel (design §3.7): the pre-flight message, or each
 * item's status with a link to its page, the summary, and Stop / Retry /
 * Close. "Retry" waits, with a countdown, for the earliest `retryAfter`.
 */
import { retryCandidates } from "../../../application/garmin-bulk/bulk-retry";
import type { SendWeekState } from "../../../hooks/send-week/use-send-week";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { SendWeekItem } from "./SendWeekItem";
import { SendWeekPreflight } from "./SendWeekPreflight";
import { SendWeekSummary } from "./SendWeekSummary";
import { useRetryCountdown } from "./use-retry-countdown";

export type SendWeekPanelProps = {
  state: Exclude<SendWeekState, { phase: "idle" }>;
  weekId: string;
  features: readonly string[];
  onCancel: () => void;
  onRetry: () => void;
  onClose: () => void;
};

export function SendWeekPanel(p: SendWeekPanelProps) {
  const t = useTranslate("calendar");
  const outcomes = p.state.phase === "blocked" ? [] : p.state.outcomes;
  const seconds = useRetryCountdown(outcomes);
  const running = p.state.phase === "running";
  const canRetry =
    p.state.phase === "done" &&
    seconds === undefined &&
    retryCandidates(outcomes, Date.now(), p.features).length > 0;
  return (
    <section
      aria-label={t("sendWeek.title")}
      className="flex flex-col gap-3 rounded-xl border border-edge-soft bg-surface p-3.5 text-[13px] text-ink-body"
    >
      {p.state.phase === "blocked" ? (
        <SendWeekPreflight failure={p.state.failure} />
      ) : (
        <>
          <p role="status">
            {t("sendWeek.progress", {
              done: outcomes.length,
              total: p.state.total,
            })}
            {p.state.phase === "done" && p.state.cancelled
              ? ` ${t("sendWeek.stopped")}`
              : ""}
          </p>
          <ul className="flex flex-col gap-1">
            {outcomes.map((o) => (
              <SendWeekItem key={o.workoutId} outcome={o} weekId={p.weekId} />
            ))}
          </ul>
          {!running && <SendWeekSummary outcomes={outcomes} />}
        </>
      )}
      <div className="flex justify-end gap-2">
        {running && (
          <Button size="sm" variant="secondary" onClick={p.onCancel}>
            {t("sendWeek.stop")}
          </Button>
        )}
        {p.state.phase === "done" && (seconds !== undefined || canRetry) && (
          <Button size="sm" onClick={p.onRetry} disabled={!canRetry}>
            {seconds === undefined
              ? t("sendWeek.retry")
              : t("sendWeek.retryIn", { seconds })}
          </Button>
        )}
        {!running && (
          <Button size="sm" variant="secondary" onClick={p.onClose}>
            {t("sendWeek.close")}
          </Button>
        )}
      </div>
    </section>
  );
}
