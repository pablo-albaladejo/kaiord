/**
 * T5 (design §3.9): resolves an `uncertain` placement by reading Garmin over
 * the dates of the `uncertain` and of its `held` entries. One match is
 * adopted (`keep`, a `scheduled` previous `retire`; `placement-t5-adoption`
 * says which entry and how it is recorded); `held` ids the reads do not
 * see become `gone` — only when the reads carry ids (A3); several
 * matches are a `duplicate-left`; none, or a failed read, stays `uncertain`.
 */
import { canonicalHash } from "@kaiord/core";

import type { Uncertain } from "./placement-claim";
import type { PlacementRun } from "./placement-deps";
import type { Settled } from "./placement-resolve-step";
import { type PlacementResult, recordDeleted } from "./placement-result";
import { decide } from "./placement-row";
import { adoption } from "./placement-t5-adoption";
import { readHeldMonths } from "./placement-t5-read";

type Verdict = Settled | "undecided";

export const resolveUncertain = async (
  run: PlacementRun,
  u: Uncertain
): Promise<Verdict> => {
  if (!run.deps.canFind) return "undecided";
  const reads = await readHeldMonths(run, u);
  if (!reads) return "undecided";
  const a3 = run.deps.scheduleIdsInFind && reads.allHaveIds;
  const { verdict } = await decide<Verdict>(run.deps, run.key, (row) => {
    if (!row) return { verdict: { kind: "done", result: recordDeleted() } };
    const same =
      row.placement && canonicalHash(row.placement) === canonicalHash(u);
    if (!same) return { verdict: "undecided" };
    const found = adoption(u, row, reads, a3);
    if (typeof found !== "number")
      return {
        write: found.row,
        verdict: { kind: "adopted", placed: found.placed, many: false },
      };
    if (found === 0) return { verdict: "undecided" };
    const result: PlacementResult = { kind: "duplicate-left", dates: [u.date] };
    return { verdict: { kind: "done", result } };
  });
  return verdict;
};
