/**
 * "It's in Garmin" (design §3.4): the athlete confirms an `uncertain` (or an
 * unresolved `attempting{posted:true}`) as `unconfirmed` with
 * `supersedes: []` — the entry they see may be a known id. Offered only
 * when no non-`keep` entry shares its workout and date; a `scheduled`
 * previous is retired and drained, as after a commit. A posted attempt
 * before its gate is refused with no write: its POST may still land.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { PlacementRun } from "./placement-deps";
import { finishPlacement, unconfirmedLeftBehind } from "./placement-finish";
import { gateOf } from "./placement-resolve";
import {
  failed,
  type PlacementResult,
  recordDeleted,
  settling,
} from "./placement-result";
import { canConfirmAt, decide, placedRow } from "./placement-row";

type Verdict =
  | { kind: "placed"; placed: GarminPlaced; previous?: GarminPlaced }
  | { kind: "result"; result: PlacementResult };

export const confirmInGarmin = async (
  run: Omit<PlacementRun, "desired">
): Promise<PlacementResult> => {
  const { verdict } = await decide<Verdict>(run.deps, run.key, (row) => {
    if (!row) return { verdict: { kind: "result", result: recordDeleted() } };
    const p = row.placement;
    const open =
      p?.kind === "uncertain" || (p?.kind === "attempting" && p.posted);
    if (!p || !open)
      return {
        verdict: { kind: "result", result: failed("guard-failed", true) },
      };
    if (p.kind === "attempting" && run.deps.now() < gateOf(p))
      return { verdict: { kind: "result", result: settling(gateOf(p)) } };
    if (!canConfirmAt(row, p.workoutId, p.date)) {
      const result: PlacementResult = {
        kind: "uncertain",
        date: p.date,
        canConfirm: false,
      };
      return { verdict: { kind: "result", result } };
    }
    const placed: GarminPlaced = {
      kind: "unconfirmed",
      workoutId: p.workoutId,
      date: p.date,
      supersedes: [],
    };
    return {
      write: placedRow(row, placed, p.previous),
      verdict: { kind: "placed", placed, previous: p.previous },
    };
  });
  if (verdict.kind === "result") return verdict.result;
  const { placed, previous } = verdict;
  const full = { ...run, desired: placed };
  return finishPlacement(
    full,
    placed,
    "scheduled",
    unconfirmedLeftBehind(previous, placed)
  );
};
