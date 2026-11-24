/**
 * The end of a run that holds a `Placed`: drain, then report. The result is
 * `duplicate-left` naming the dates of every entry left behind — a `retire`
 * still queued, the other candidates of an adoption, or an `unconfirmed`
 * superseded entry with no id to delete (design "Pipeline details settled
 * in T5"); with none, `foreign-left` names, once, where an entry Kaiord has
 * no record of creating stayed behind (`placement-foreign-left`); a row deleted meanwhile is `record-deleted` with the date. A
 * drain that found the `Placed` dead left the row `uncertain` (verify
 * before delete, §3.5): the run reports that, never a success. `ownPost`:
 * `placed` is this run's own ok POST, never judged dead by a drain. After
 * the drain, an earlier library workout Kaiord created that no entry uses
 * is deleted (`cleanLibrary`); that step never changes the result.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { isKaiords } from "../sync/merge-garmin-removal-queue";
import type { PlacementRun } from "./placement-deps";
import { noticeForeignLeft } from "./placement-foreign-left";
import { cleanLibrary } from "./placement-library-cleanup";
import { drainQueue } from "./placement-removal-step";
import { type PlacementResult, recordDeleted } from "./placement-result";
import { canConfirmAt } from "./placement-row";

export type Placed = "scheduled" | "moved" | "unchanged";

export const finishPlacement = async (
  run: PlacementRun,
  placed: GarminPlaced,
  kind: Placed,
  leftBehind: readonly string[],
  ownPost = false
): Promise<PlacementResult> => {
  await drainQueue(run, placed, ownPost);
  await cleanLibrary(run);
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  if (!row) return recordDeleted(placed.date);
  const p = row.placement;
  if (p?.kind === "uncertain") {
    const canConfirm = canConfirmAt(row, p.workoutId, p.date);
    return { kind: "uncertain", date: p.date, canConfirm };
  }
  const retired = (row.removalQueue ?? [])
    .filter((e) => e.state === "retire" && isKaiords(e))
    .map((e) => e.date);
  const dates = [...new Set([...retired, ...leftBehind])].sort();
  if (dates.length > 0) return { kind: "duplicate-left", dates };
  const foreign = await noticeForeignLeft(run);
  return foreign.length > 0
    ? { kind: "foreign-left", dates: foreign }
    : { kind };
};

/** A superseded `unconfirmed` has no id to delete: it stays behind. */
export const unconfirmedLeftBehind = (
  previous: GarminPlaced | undefined,
  placed: GarminPlaced
): string[] =>
  previous?.kind === "unconfirmed" &&
  !(previous.workoutId === placed.workoutId && previous.date === placed.date)
    ? [previous.date]
    : [];
