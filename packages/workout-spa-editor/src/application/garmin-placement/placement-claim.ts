/**
 * Step 4 (design §3.3): branch on the current placement and, when a POST is
 * needed, write `attempting{posted:false}` with `supersedes` = every queue
 * id this claim reads — taken before the POST mints an id, never later.
 */
import {
  canonicalScheduleIds,
  type GarminPlaced,
  type GarminPlacement,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import { isoAt, type PlacementRun } from "./placement-deps";
import {
  type Attempt,
  decide,
  type Decision,
  type Row,
  withoutUndefined,
} from "./placement-row";

export type Uncertain = Extract<GarminPlacement, { kind: "uncertain" }>;

export type ClaimVerdict =
  | { kind: "absent" }
  | { kind: "unchanged"; placed: GarminPlaced }
  | { kind: "resolve"; attempt: Attempt }
  | { kind: "uncertain"; placement: Uncertain }
  | { kind: "claimed"; attempt: Attempt; preClaim: Row };

const previousOf = (p: GarminPlacement | undefined) =>
  isGarminPlaced(p) ? p : p?.previous;

const claimDecision = (
  run: PlacementRun,
  row: Row | undefined
): Decision<ClaimVerdict> => {
  if (!row) return { verdict: { kind: "absent" } };
  const p = row.placement;
  const { workoutId, date } = run.desired;
  if (isGarminPlaced(p) && p.workoutId === workoutId && p.date === date)
    return { verdict: { kind: "unchanged", placed: p } };
  if (p?.kind === "attempting" && p.posted)
    return { verdict: { kind: "resolve", attempt: p } };
  if (p?.kind === "uncertain" && !run.sendAnyway)
    return { verdict: { kind: "uncertain", placement: p } };
  const attempt: Attempt = withoutUndefined({
    kind: "attempting",
    workoutId,
    date,
    at: isoAt(run.deps.now()),
    posted: false,
    previous: previousOf(p),
    supersedes: canonicalScheduleIds(
      (row.removalQueue ?? []).map((e) => e.workoutScheduleId)
    ),
  });
  return {
    write: { ...row, placement: attempt },
    verdict: { kind: "claimed", attempt, preClaim: row },
  };
};

export const claimPlacement = async (
  run: PlacementRun
): Promise<ClaimVerdict> =>
  (await decide(run.deps, run.key, (row) => claimDecision(run, row))).verdict;
