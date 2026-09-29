/**
 * T5 (design §3.9): resolves an `uncertain` placement by reading Garmin over
 * the dates of the `uncertain` and of its `held` entries. One match is
 * adopted (`keep`, a `scheduled` previous `retire`); `held` ids the reads
 * do not see become `gone` — only when the reads carry ids (A3); several
 * matches are a `duplicate-left`; none, or a failed read, stays `uncertain`.
 */
import { canonicalHash } from "@kaiord/core";

import type { GarminPlaced } from "../../types/garmin-ledger";
import type { Uncertain } from "./placement-claim";
import type { PlacementRun } from "./placement-deps";
import type { Settled } from "./placement-resolve-step";
import { type PlacementResult, recordDeleted } from "./placement-result";
import {
  canConfirmAt,
  decide,
  placedRow,
  type Row,
  withEntries,
} from "./placement-row";
import { readHeldMonths } from "./placement-t5-read";

type Reads = NonNullable<Awaited<ReturnType<typeof readHeldMonths>>>;
type Verdict = Settled | "undecided";

const adoption = (u: Uncertain, row: Row, reads: Reads, a3: boolean) => {
  const dead = new Set(
    (row.removalQueue ?? [])
      .filter((e) => e.state === "retire" || e.state === "gone")
      .map((e) => e.workoutScheduleId)
  );
  const matches = reads.entries.filter(
    (e) =>
      e.workoutId === u.workoutId &&
      e.date === u.date &&
      !(e.workoutScheduleId && dead.has(e.workoutScheduleId))
  );
  const [match] = matches;
  if (!match || matches.length > 1) return matches.length;
  const id = match.workoutScheduleId;
  if (!id && !canConfirmAt(row, u.workoutId, u.date)) return 0;
  const placed: GarminPlaced = id
    ? {
        kind: "scheduled",
        workoutScheduleId: id,
        workoutId: u.workoutId,
        date: u.date,
      }
    : {
        kind: "unconfirmed",
        workoutId: u.workoutId,
        date: u.date,
        supersedes: [],
      };
  const unseen = (row.removalQueue ?? []).filter(
    (e) =>
      e.state === "held" && id && a3 && !reads.seen.has(e.workoutScheduleId)
  );
  const gone = unseen.map((e) => ({ ...e, state: "gone" as const }));
  return { placed, row: withEntries(placedRow(row, placed, u.previous), gone) };
};

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
