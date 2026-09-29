/**
 * The rollback of a definite `schedule` failure: `previous` goes back. When
 * the row is still exactly the one this run wrote, and this run's writes
 * changed nothing but its placement and clock, the pre-claim row is
 * restored verbatim, clock included, so the rollback is invisible to the
 * merge order (design "Pipeline details settled in T5"). Otherwise a write
 * landed in between, and a stamped restore keeps it.
 */
import { canonicalHash } from "@kaiord/core";

import { restoreLedgerRow } from "../../types/export-ledger";
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import type { PlacementRun } from "./placement-deps";
import { type Attempt, decide, isAttemptAt, type Row } from "./placement-row";

export type RestoreVerdict = "restored" | "absent" | "changed";

const beyondPlacement = (row: Row) =>
  canonicalHash({ ...row, placement: null, updatedAt: null });

/** `row` is the one this run wrote, over nothing but its own claim. */
const onlyOurs = (row: Row, written?: Row, preClaim?: Row) =>
  written !== undefined &&
  preClaim !== undefined &&
  canonicalHash(row) === canonicalHash(written) &&
  beyondPlacement(written) === beyondPlacement(preClaim);

/** `missing`: a 404 on an earlier push's library id — also flag the row
    for a re-push (`forceRepush`, `library: missing`). */
export const restorePrevious = async (
  run: PlacementRun,
  attempt: Attempt,
  written?: Row,
  preClaim?: Row,
  missing?: GarminWorkoutId
): Promise<RestoreVerdict> =>
  (
    await decide(run.deps, run.key, (row) => {
      if (!row) return { verdict: "absent" as const };
      if (!isAttemptAt(row, attempt.at)) return { verdict: "changed" as const };
      if (preClaim && onlyOurs(row, written, preClaim) && !missing)
        return {
          write: restoreLedgerRow(preClaim),
          verdict: "restored" as const,
        };
      const restored: Row = { ...row, placement: attempt.previous };
      if (!attempt.previous) delete restored.placement;
      const flagged: Row = missing
        ? {
            ...restored,
            forceRepush: true,
            library: { kind: "missing", workoutId: missing },
          }
        : restored;
      return { write: flagged, verdict: "restored" as const };
    })
  ).verdict;
