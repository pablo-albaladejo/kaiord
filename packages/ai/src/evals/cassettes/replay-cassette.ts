import type { LanguageModel } from "ai";
import type { DimensionOutcome } from "../types";
import type { Cassette } from "./cassette-schema";
import { createReplayModel } from "./replay-model";
import type { StaleHash } from "./replay-model";
import { fixtureHashOf } from "./request-hashes";

export type ReplayCase = {
  id: string;
  /** Exactly what the case shows the model; hashed into `fixtureHash`. */
  fixture: unknown;
  /** Runs the case through the real runtime and scores the result. */
  run: (model: LanguageModel) => Promise<Array<DimensionOutcome>>;
};

export type ReplaySuite = {
  /** The model id the current request names; part of the request hash. */
  modelId: string;
  prompt: { id: string; version: string; hash: string };
  cases: ReadonlyArray<ReplayCase>;
};

export type UnmeasuredCause =
  | "synthetic"
  | "orphan"
  | "model-mismatch"
  | "stale"
  | "not-consumed"
  | "nothing-scored";

export type CaseVerdict = { cassetteId: string; caseId: string } & (
  | { status: "passed" }
  | { status: "failed"; failures: Array<string> }
  | {
      status: "unmeasured";
      cause: UnmeasuredCause;
      reason: string;
      stale?: Array<StaleHash>;
    }
);

export const unmeasured = (
  cassette: Cassette,
  cause: UnmeasuredCause,
  reason: string,
  stale?: Array<StaleHash>
): CaseVerdict => ({
  cassetteId: cassette.id,
  caseId: cassette.caseId,
  status: "unmeasured",
  cause,
  reason,
  ...(stale ? { stale } : {}),
});

const staticStaleness = (
  suite: ReplaySuite,
  cassette: Cassette,
  replayCase: ReplayCase
): Array<StaleHash> => {
  const { id, version, hash } = cassette.prompt;
  const current = suite.prompt;
  const promptStale =
    id !== current.id || version !== current.version || hash !== current.hash;
  const fixtureStale =
    cassette.fixtureHash !== fixtureHashOf(replayCase.fixture);
  return [
    ...(promptStale ? ["prompt" as const] : []),
    ...(fixtureStale ? ["fixture" as const] : []),
  ];
};

const stale = (cassette: Cassette, hashes: Array<StaleHash>) =>
  unmeasured(cassette, "stale", `stale: ${hashes.join(", ")}`, hashes);

/** A verdict needs a scorer that measured something; none is not a pass. */
const scored = (
  cassette: Cassette,
  outcomes: Array<DimensionOutcome>
): CaseVerdict => {
  const ids = { cassetteId: cassette.id, caseId: cassette.caseId };
  const failures = outcomes.flatMap((o) =>
    o.status === "failed"
      ? [`case ${cassette.caseId} failed scorer "${o.dimension}": ${o.message}`]
      : []
  );
  if (failures.length > 0) return { ...ids, status: "failed", failures };
  return outcomes.some((o) => o.status === "passed")
    ? { ...ids, status: "passed" }
    : unmeasured(cassette, "nothing-scored", "no scorer measured the case");
};

/**
 * One real cassette against its case. It is measured only when the case made
 * exactly one model call, so the recorded response is what got scored.
 */
export const replayCassette = async (
  suite: ReplaySuite,
  cassette: Cassette,
  replayCase: ReplayCase
): Promise<CaseVerdict> => {
  const preflight = staticStaleness(suite, cassette, replayCase);
  if (preflight.length > 0) return stale(cassette, preflight);

  let staleHashes: Array<StaleHash> = [];
  const model = createReplayModel(cassette, suite.modelId, (hashes) => {
    staleHashes = hashes;
  });
  const run = await replayCase.run(model).then(
    (outcomes) => ({ outcomes, error: undefined }),
    (error: unknown) => ({ outcomes: [], error })
  );
  if (staleHashes.length > 0) return stale(cassette, staleHashes);
  const calls = model.doGenerateCalls.length;
  if (calls !== 1) {
    return unmeasured(
      cassette,
      "not-consumed",
      `cassette not consumed: ${calls} model calls, expected exactly 1`
    );
  }
  if (run.error === undefined) return scored(cassette, run.outcomes);
  const message =
    run.error instanceof Error ? run.error.message : String(run.error);
  return scored(cassette, [{ dimension: "run", status: "failed", message }]);
};
