import { createTextToWorkout } from "../../adapters/text-to-workout";
import { evaluateBenchmark } from "../assertions";
import benchmarks from "../benchmarks.json";
import type { ReplaySuite } from "../cassettes/case-verdict";
import type { Benchmark } from "../types";
import type { CassetteTargets } from "./cassette-writer";
import { writeCassette } from "./cassette-writer";
import type { LiveCase } from "./live-pass";
import { recordCase } from "./record-case";

/**
 * Measurement runs the production path, retries included: each retry is one
 * more model call counted against the budget.
 */
export const parserLiveCases = (
  cases: ReadonlyArray<Benchmark> = benchmarks as Array<Benchmark>
): Array<LiveCase> =>
  cases.map((benchmark) => ({
    id: benchmark.id,
    run: async (model) => {
      const start = Date.now();
      const workout = await createTextToWorkout({ model })(benchmark.text, {
        sport: benchmark.expectedSport as never,
        athlete: benchmark.athleteZones
          ? { zones: benchmark.athleteZones }
          : undefined,
      });
      return evaluateBenchmark(benchmark, workout, Date.now() - start).outcomes;
    },
  }));

/**
 * Recording runs the replay suite's cases (`maxRetries: 0`), so each case is
 * one call and one cassette, scored on the same answer it stores.
 */
export const recordingLiveCases = (
  suite: ReplaySuite,
  targets?: CassetteTargets,
  onWrite: (path: string) => void = () => undefined
): Array<LiveCase> =>
  suite.cases.map((replayCase) => ({
    id: replayCase.id,
    run: async (model) => {
      const recorded = await recordCase(suite, replayCase, model);
      onWrite(writeCassette(recorded.cassette, targets));
      if ("error" in recorded.outcome) throw recorded.outcome.error;
      return recorded.outcome.outcomes;
    },
  }));
