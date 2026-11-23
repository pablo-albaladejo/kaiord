/**
 * An entry Kaiord's record does not hold as created that a move left
 * behind (recognized, superseded to `retire`) stays where it is; the athlete is told once, in
 * the run that finds it not yet `noticed`, and the guarded write that marks
 * it `noticed` keeps the notice from repeating on any later run or device.
 */
import { isKaiords } from "../sync/merge-garmin-removal-queue";
import type { PlacementRun } from "./placement-deps";
import { decide, withEntries } from "./placement-row";

/** The dates of the foreign entries left behind that the athlete was not
    told about yet; they are marked `noticed` in the same write. */
export const noticeForeignLeft = async (run: PlacementRun): Promise<string[]> =>
  (
    await decide(run.deps, run.key, (row) => {
      const left = (row?.removalQueue ?? []).filter(
        (e) => !isKaiords(e) && e.state === "retire" && !e.noticed
      );
      if (!row || left.length === 0) return { verdict: [] };
      const noticed = left.map((e) => ({ ...e, noticed: true as const }));
      const dates = [...new Set(left.map((e) => e.date))].sort();
      return { write: withEntries(row, noticed), verdict: dates };
    })
  ).verdict;
