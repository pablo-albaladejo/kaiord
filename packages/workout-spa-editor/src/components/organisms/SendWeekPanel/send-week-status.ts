/**
 * How a bulk outcome reads: its tone, and which bucket of the summary it is
 * counted in. `library-only` is a warning, counted apart from the failures.
 */
import type {
  BulkOutcome,
  BulkStatus,
} from "../../../application/garmin-bulk/send-week-to-garmin";

export type SendWeekTone = "plain" | "warning" | "danger";
export type SendWeekBucket = "placed" | "libraryOnly" | "attention" | "skipped";

const STATUS: Record<BulkStatus, [SendWeekTone, SendWeekBucket]> = {
  scheduled: ["plain", "placed"],
  moved: ["plain", "placed"],
  unchanged: ["plain", "placed"],
  "duplicate-left": ["warning", "placed"],
  uncertain: ["danger", "attention"],
  "library-only": ["warning", "libraryOnly"],
  "not-eligible": ["plain", "skipped"],
  failed: ["danger", "attention"],
};

export const statusTone = (status: BulkStatus): SendWeekTone =>
  STATUS[status][0];

export const summarize = (outcomes: readonly BulkOutcome[]) => {
  const counts = { placed: 0, libraryOnly: 0, attention: 0, skipped: 0 };
  for (const o of outcomes) counts[STATUS[o.status][1]]++;
  return counts;
};

export const hasOutdatedBridge = (outcomes: readonly BulkOutcome[]) =>
  outcomes.some(
    (o) =>
      o.result?.kind === "library-only" && o.result.reason === "bridge-outdated"
  );
