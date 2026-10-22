import { UnsupportedFunctionalityError } from "ai";
import type { DimensionOutcome } from "../types";
import { underlyingFailureOf } from "../../agents/underlying-failure";
import { isHarnessFault, messageOf } from "./harness-fault";
import type { LanguageModelV4 } from "./language-model-types";
import type { LiveSession, StopState } from "./live-session";

export type LiveCase = {
  id: string;
  run: (model: LanguageModelV4) => Promise<Array<DimensionOutcome>>;
};

export type RunOutcome =
  | { status: "passed" }
  | { status: "failed"; reason: string }
  | { status: "unmeasured"; reason: string };

export type CaseTally = {
  id: string;
  runs: number;
  passed: number;
  failed: number;
  unmeasured: number;
  reasons: Array<string>;
};

const fromOutcomes = (outcomes: Array<DimensionOutcome>): RunOutcome => {
  const failures = outcomes.flatMap((o) =>
    o.status === "failed" ? [`${o.dimension}: ${o.message}`] : []
  );
  if (failures.length > 0) {
    return { status: "failed", reason: failures.join("; ") };
  }
  return outcomes.some((o) => o.status === "passed")
    ? { status: "passed" }
    : { status: "unmeasured", reason: "no scorer measured the case" };
};

const MAX_DEPTH = 4;

/**
 * The error and the failures it wraps, at most `MAX_DEPTH` deep: the runtime
 * keeps its raw failure internally, and other errors use `cause`.
 */
const chainOf = (error: unknown): Array<unknown> => {
  const chain: Array<unknown> = [];
  let current = error;
  while (current !== undefined && chain.length < MAX_DEPTH) {
    chain.push(current);
    current =
      underlyingFailureOf(current) ??
      (current instanceof Error ? current.cause : undefined);
  }
  return chain;
};

const stopReason = (stop: StopState) =>
  `pass stopped (${stop.kind}): ${stop.reason}`;

/**
 * A stopped pass, a harness fault or a call the CLI cannot carry leaves the
 * case unmeasured. Only a model answer that the runtime or a scorer rejects
 * is a failure. A harness fault raised outside the session stops it too, and
 * each is also found behind the runtime's wrapping errors.
 */
const runOnce = async (
  session: LiveSession,
  model: LanguageModelV4,
  liveCase: LiveCase
): Promise<RunOutcome> => {
  const before = session.stopped();
  if (before) return { status: "unmeasured", reason: stopReason(before) };
  try {
    return fromOutcomes(await liveCase.run(model));
  } catch (error) {
    const chain = chainOf(error);
    const fault = chain.find(isHarnessFault);
    if (fault)
      session.halt({ kind: "harness-fault", reason: messageOf(fault) });
    const stop = session.stopped();
    if (stop) return { status: "unmeasured", reason: stopReason(stop) };
    const unsupported = chain.find((e) =>
      UnsupportedFunctionalityError.isInstance(e)
    );
    if (unsupported)
      return { status: "unmeasured", reason: messageOf(unsupported) };
    return { status: "failed", reason: `exception: ${messageOf(error)}` };
  }
};

const tally = (id: string): CaseTally => ({
  id,
  runs: 0,
  passed: 0,
  failed: 0,
  unmeasured: 0,
  reasons: [],
});

/** Every case `repetitions` times, in order, one call at a time; never gates. */
export const runLivePass = async (options: {
  session: LiveSession;
  model: LanguageModelV4;
  cases: ReadonlyArray<LiveCase>;
  repetitions: number;
  onRun?: (id: string, outcome: RunOutcome) => void;
}): Promise<Array<CaseTally>> => {
  const tallies = options.cases.map((c) => tally(c.id));
  for (let rep = 0; rep < options.repetitions; rep++) {
    for (const [i, liveCase] of options.cases.entries()) {
      const outcome = await runOnce(options.session, options.model, liveCase);
      const entry = tallies[i] as CaseTally;
      entry.runs++;
      entry[outcome.status]++;
      if (
        outcome.status !== "passed" &&
        !entry.reasons.includes(outcome.reason)
      ) {
        entry.reasons.push(outcome.reason);
      }
      options.onRun?.(liveCase.id, outcome);
    }
  }
  return tallies;
};
