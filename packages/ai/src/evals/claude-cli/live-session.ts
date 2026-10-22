import type { ClaudeRequest } from "./clean-context-args";
import { harnessFault, messageOf } from "./harness-fault";
import { decideNextCall } from "./rate-limit-guard";
import type { WeeklyField } from "./rate-limit-guard";
import type { SpawnClaude } from "./spawn-claude";
import type { CliRun } from "./stream-messages";

export type StopKind =
  "rate-limit" | "harness-fault" | "budget" | "context-leak";
export type StopState = { kind: StopKind; reason: string };

export type LiveSession = {
  /** One model call; refused once the pass has stopped. */
  call: (request: ClaudeRequest) => Promise<CliRun>;
  halt: (state: StopState) => void;
  stopped: () => StopState | undefined;
  callsMade: () => number;
  apiEquivalentCostUsd: () => number;
};

export type SessionOptions = {
  spawnClaude: SpawnClaude;
  maxCalls: number;
  maxWeekly: number;
  field: WeeklyField | null;
};

/**
 * The pass's single gate to the CLI: one call at a time, a call budget, and
 * the rate-limit guard read after every call to decide the next. A stop is a
 * harness state, never a failed case.
 */
export const createLiveSession = (options: SessionOptions): LiveSession => {
  let calls = 0;
  let cost = 0;
  let inFlight = false;
  let stop: StopState | undefined;
  const halt = (state: StopState) => {
    stop ??= state;
  };

  const admit = () => {
    if (inFlight) {
      halt({
        kind: "harness-fault",
        reason: "concurrency is 1: a call started while another ran",
      });
    }
    if (calls >= options.maxCalls) {
      halt({
        kind: "budget",
        reason: `EVAL_MAX_CALLS=${options.maxCalls} model calls made`,
      });
    }
    if (stop) throw harnessFault(`pass stopped (${stop.kind}): ${stop.reason}`);
  };

  const call = async (request: ClaudeRequest): Promise<CliRun> => {
    admit();
    inFlight = true;
    calls += 1;
    try {
      const run = await options.spawnClaude(request);
      cost += run.result.apiEquivalentCostUsd;
      const decision = decideNextCall(run.rateLimitInfos, options);
      if (decision.action === "stop")
        halt({ kind: decision.kind, reason: decision.reason });
      return run;
    } catch (error) {
      halt({ kind: "harness-fault", reason: messageOf(error) });
      throw error;
    } finally {
      inFlight = false;
    }
  };

  return {
    call,
    halt,
    stopped: () => stop,
    callsMade: () => calls,
    apiEquivalentCostUsd: () => cost,
  };
};
