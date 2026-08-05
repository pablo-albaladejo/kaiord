/**
 * The week in one line: how much is done and matched, how much is ready but
 * has not reached a watch, and how much still has no structure.
 *
 * The three steps are told apart by lightness and by their label, never by
 * hue — the five hues belong to training zones, and "ready" is not a zone.
 * Each count is stated as text, so the bar is a summary of the sentence
 * rather than the only place the number exists.
 *
 * Renders nothing when all three counts are zero: a week with nothing to
 * report says nothing (principle 2).
 */
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { type WeekStatus, weekStatusIsSilent } from "../../pages/week-status";

const STEPS = [
  { key: "doneAndMatched", fill: "bg-edge" },
  { key: "readyNotPushed", fill: "bg-ink-muted" },
  { key: "needsStructure", fill: "bg-ink-strong" },
] as const;

export type WeekStatusBarProps = {
  status: WeekStatus;
};

export function WeekStatusBar({ status }: WeekStatusBarProps) {
  const t = useTranslate("calendar");
  if (weekStatusIsSilent(status)) return null;

  return (
    <section data-testid="week-status-bar" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {t("weekStatus.heading")}
        </h2>
        {status.readyNotPushed > 0 && (
          <span className="text-xs tabular-nums text-ink-muted">
            {t(pluralKey("weekStatus.waiting", status.readyNotPushed), {
              count: status.readyNotPushed,
            })}
          </span>
        )}
      </div>
      <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-surface-elevated">
        {STEPS.map((step) => (
          <div
            key={step.key}
            className={step.fill}
            style={{ flex: status[step.key] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1">
        {STEPS.map((step) => (
          <span
            key={step.key}
            data-testid={`week-status-${step.key}`}
            className="inline-flex items-center gap-1.5 text-xs tabular-nums text-ink-muted"
          >
            <span className={`h-2 w-2 rounded-[2px] ${step.fill}`} />
            {t(pluralKey(`weekStatus.${step.key}`, status[step.key]), {
              count: status[step.key],
            })}
          </span>
        ))}
      </div>
    </section>
  );
}
