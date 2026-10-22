import type { LanguageModel } from "ai";
import type { DimensionOutcome } from "../types";
import type { Cassette } from "./cassette-schema";
import { createReplayModel } from "./replay-model";
import type { StaleHash } from "./replay-model";
import { fixtureHashOf } from "./request-hashes";

export type ReplayCase = {
  id: string;
  /** What the case feeds the model; hashed into `fixtureHash`. */
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

export type CaseVerdict = { cassetteId: string; caseId: string } & (
  | { status: "passed" }
  | { status: "failed"; failures: Array<string> }
  | { status: "unmeasured"; reason: string; stale?: Array<StaleHash> }
);

const staticStaleness = (
  suite: ReplaySuite,
  cassette: Cassette,
  replayCase: ReplayCase
): Array<StaleHash> => {
  const { id, version, hash } = cassette.prompt;
  const current = suite.prompt;
  const promptStale =
    id !== current.id || version !== current.version || hash !== current.hash;
  return [
    ...(promptStale ? ["prompt" as const] : []),
    ...(cassette.fixtureHash === fixtureHashOf(replayCase.fixture)
      ? []
      : ["fixture" as const]),
  ];
};

const staleVerdict = (cassette: Cassette, stale: Array<StaleHash>) => ({
  cassetteId: cassette.id,
  caseId: cassette.caseId,
  status: "unmeasured" as const,
  reason: `stale cassette: ${stale.join(", ")} hash changed`,
  stale,
});

const scored = (
  cassette: Cassette,
  outcomes: Array<DimensionOutcome>
): CaseVerdict => {
  const failures = outcomes.flatMap((o) =>
    o.status === "failed"
      ? [`case ${cassette.caseId} failed scorer "${o.dimension}": ${o.message}`]
      : []
  );
  const ids = { cassetteId: cassette.id, caseId: cassette.caseId };
  return failures.length === 0
    ? { ...ids, status: "passed" }
    : { ...ids, status: "failed", failures };
};

/** One real cassette against its case: stale, failed or passed. */
export const replayCassette = async (
  suite: ReplaySuite,
  cassette: Cassette,
  replayCase: ReplayCase
): Promise<CaseVerdict> => {
  const preflight = staticStaleness(suite, cassette, replayCase);
  if (preflight.length > 0) return staleVerdict(cassette, preflight);

  let stale: Array<StaleHash> = [];
  const model = createReplayModel(cassette, suite.modelId, (hashes) => {
    stale = hashes;
  });
  try {
    const outcomes = await replayCase.run(model);
    return stale.length > 0
      ? staleVerdict(cassette, stale)
      : scored(cassette, outcomes);
  } catch (error) {
    if (stale.length > 0) return staleVerdict(cassette, stale);
    const message = error instanceof Error ? error.message : String(error);
    return scored(cassette, [{ dimension: "run", status: "failed", message }]);
  }
};
