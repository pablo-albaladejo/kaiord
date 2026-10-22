import { scored, stale, staticStaleness, unmeasured } from "./case-verdict";
import type { CaseVerdict, ReplayCase, ReplaySuite } from "./case-verdict";
import type { Cassette } from "./cassette-schema";
import { createReplayModel } from "./replay-model";
import type { StaleHash } from "./replay-model";

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
