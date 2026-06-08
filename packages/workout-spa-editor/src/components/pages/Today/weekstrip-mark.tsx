/**
 * Per-day mark for a WeekStrip column: a faint hairline when the day is empty,
 * else an intensity-tinted dot — filled when the intensity is measured (TSS),
 * outline when estimated (coaching effort), neutral when presence-only — plus a
 * small count when the day holds 2+ entries.
 */
import type { DaySummary, IntensityBucket } from "./build-week-summary";

const FILL: Record<IntensityBucket, string> = {
  easy: "bg-sky-500/40",
  moderate: "bg-sky-500/70",
  hard: "bg-sky-400",
};
const RING: Record<IntensityBucket, string> = {
  easy: "border border-sky-500/40",
  moderate: "border border-sky-500/70",
  hard: "border border-sky-400",
};

function dotClass(summary: DaySummary): string {
  if (!summary.intensity) return "border border-slate-500";
  return summary.estimated ? RING[summary.intensity] : FILL[summary.intensity];
}

export function WeekStripMark({ summary }: { summary: DaySummary }) {
  if (summary.count === 0) {
    return (
      <span
        data-testid="weekstrip-empty"
        aria-hidden="true"
        className="h-px w-3 rounded-full bg-slate-700"
      />
    );
  }
  return (
    <span className="flex items-center gap-0.5">
      <span
        data-testid="weekstrip-dot"
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${dotClass(summary)}`}
      />
      {summary.count >= 2 && (
        <span className="text-[9px] font-semibold leading-none text-slate-500">
          {summary.count}
        </span>
      )}
    </span>
  );
}
