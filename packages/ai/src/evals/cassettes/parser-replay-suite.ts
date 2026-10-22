import { createTextToWorkout } from "../../adapters/text-to-workout";
import { WORKOUT_PARSER_SYSTEM } from "../../prompts/parse-workout-prompt";
import { evaluateBenchmark } from "../assertions";
import benchmarks from "../benchmarks.json";
import type { Benchmark } from "../types";
import type { ReplayCase, ReplaySuite } from "./case-verdict";
import { promptHashOf } from "./request-hashes";
import { OFFICIAL_CASSETTE_MODEL } from "./validate-cassette";

/**
 * Only what reaches the prompt. Scorer expectations (`minSteps`, `zoneCheck`,
 * `category`, ...) stay out, so tightening one re-scores the stored answer
 * keylessly instead of forcing a quota-bound re-record.
 */
export const modelVisibleInput = (benchmark: Benchmark) => ({
  text: benchmark.text,
  sport: benchmark.expectedSport ?? null,
  athleteZones: benchmark.athleteZones ?? null,
});

/**
 * `maxRetries: 0` because a cassette is one recorded call: a retry would send
 * a request carrying validation feedback that no cassette holds.
 */
const parserCase = (benchmark: Benchmark): ReplayCase => ({
  id: benchmark.id,
  fixture: modelVisibleInput(benchmark),
  run: async (model) => {
    const start = Date.now();
    const textToWorkout = createTextToWorkout({ model, maxRetries: 0 });
    const workout = await textToWorkout(benchmark.text, {
      sport: benchmark.expectedSport as never,
      athlete: benchmark.athleteZones
        ? { zones: benchmark.athleteZones }
        : undefined,
    });
    return evaluateBenchmark(benchmark, workout, Date.now() - start).outcomes;
  },
});

/** The workout-parser benchmarks as a replay suite over the real runtime. */
export const createParserReplaySuite = (
  modelId: string = OFFICIAL_CASSETTE_MODEL,
  cases: ReadonlyArray<Benchmark> = benchmarks as Array<Benchmark>
): ReplaySuite => ({
  modelId,
  prompt: {
    id: WORKOUT_PARSER_SYSTEM.id,
    version: WORKOUT_PARSER_SYSTEM.version,
    hash: promptHashOf(WORKOUT_PARSER_SYSTEM),
  },
  cases: cases.map(parserCase),
});
