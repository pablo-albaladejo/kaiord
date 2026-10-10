/**
 * The bulk "Send week" runner (design §3.7, AC-43/45): sequential, 500 ms
 * between pushed items, each item through the same placement pipeline with
 * its own per-record lock (`pushOne`). A failure — even a thrown one —
 * never stops the run; a cancel stops it between items, and the items it
 * kept from running are reported `not-eligible{stopped}`, so the run still
 * lists the whole week. `not-eligible` items are reported without a call.
 * An item is reported on the date it was placed for, which may differ from
 * its date at selection (a coach move in between).
 */
import { logGarminPushFailure } from "../garmin-placement/log-garmin-push-failure";
import type {
  PlacementResult,
  PlacementResultKind,
} from "../garmin-placement/placement-result";
import { failed } from "../garmin-placement/placement-result";
import type {
  NotEligibleReason,
  WeekPushCandidate,
} from "./select-week-push-candidates";

export const BULK_ITEM_GAP_MS = 500;

export type BulkStatus = PlacementResultKind | "not-eligible";

export type BulkOutcome = {
  workoutId: string;
  date: string;
  status: BulkStatus;
  result?: PlacementResult;
  notEligible?: NotEligibleReason;
};

/** One item's result, with the workout date it was placed for. */
export type BulkItemResult = { result: PlacementResult; date?: string };

export type SendWeekDeps = {
  pushOne: (workoutId: string) => Promise<BulkItemResult>;
  sleep: (ms: number) => Promise<void>;
  isCancelled: () => boolean;
  onOutcome?: (outcome: BulkOutcome) => void;
};

export type BulkRun = { outcomes: BulkOutcome[]; cancelled: boolean };

const pushSafely = async (
  deps: SendWeekDeps,
  workoutId: string
): Promise<BulkItemResult> => {
  try {
    return await deps.pushOne(workoutId);
  } catch (error) {
    logGarminPushFailure(error);
    return { result: failed("library-push-failed", true) };
  }
};

export const sendWeekToGarmin = async (
  deps: SendWeekDeps,
  candidates: readonly WeekPushCandidate[]
): Promise<BulkRun> => {
  const outcomes: BulkOutcome[] = [];
  const report = (outcome: BulkOutcome) => {
    outcomes.push(outcome);
    deps.onOutcome?.(outcome);
  };
  let pushed = 0;
  let cancelled = false;
  const stop = () => (cancelled ||= deps.isCancelled());
  for (const { workoutId, date, notEligible } of candidates) {
    if (notEligible) {
      report({ workoutId, date, status: "not-eligible", notEligible });
      continue;
    }
    if (!stop() && pushed++ > 0) await deps.sleep(BULK_ITEM_GAP_MS);
    if (stop()) {
      report({
        workoutId,
        date,
        status: "not-eligible",
        notEligible: "stopped",
      });
      continue;
    }
    const { result, date: placed = date } = await pushSafely(deps, workoutId);
    report({ workoutId, date: placed, status: result.kind, result });
  }
  return { outcomes, cancelled };
};
