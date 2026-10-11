import { recordedSleepSeconds } from "../../../application/health/recorded-sleep-duration";
import { useTranslate } from "../../../i18n/use-translate";
import type { HealthSleepRecord } from "../../../types/health/health-records";
import { sleepBarPercent, sleepDurationParts } from "./format-sleep-duration";
import { HealthSourceBadge } from "./HealthSourceBadge";

export type SleepNightRowProps = { record: HealthSleepRecord };

/**
 * One night: date, a bar proportional to a full night, the duration, and where
 * the record came from. The bar is a graphical object, so it takes the ink
 * roles rather than a hue — a night's length is not a training zone. A night
 * whose duration was not recorded says so instead of showing 0 h.
 */
export function SleepNightRow({ record }: SleepNightRowProps) {
  const t = useTranslate("health");
  const seconds = recordedSleepSeconds(record.krd);
  const { score } = record.krd;
  return (
    <li
      className="flex flex-wrap items-center gap-3 border-b border-edge-soft px-1 py-3 text-sm last:border-b-0"
      data-testid="sleep-night-row"
    >
      <span className="w-20 shrink-0 font-medium tabular-nums text-ink-body">
        {record.date}
      </span>
      <span
        aria-hidden="true"
        className="h-2.5 min-w-24 flex-1 overflow-hidden rounded-sm bg-surface-elevated"
      >
        <span
          className="block h-full rounded-sm bg-ink-strong"
          style={{ width: `${sleepBarPercent(seconds ?? 0)}%` }}
        />
      </span>
      <span className="min-w-20 shrink-0 text-right font-medium tabular-nums text-ink-strong">
        {seconds === undefined
          ? t("sleep.durationNotRecorded")
          : t("sleep.duration", sleepDurationParts(seconds))}
      </span>
      {score !== undefined && (
        <span className="shrink-0 tabular-nums text-ink-muted">
          {t("sleep.score", { score })}
        </span>
      )}
      <HealthSourceBadge sourceBridgeId={record.sourceBridgeId} />
    </li>
  );
}
