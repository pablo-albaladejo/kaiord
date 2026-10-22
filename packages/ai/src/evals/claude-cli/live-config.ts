import { OFFICIAL_CASSETTE_MODEL } from "../cassettes/validate-cassette";
import type { Env } from "./child-env";
import { DEFAULT_MAX_WEEKLY_UTILIZATION } from "./rate-limit-guard";

export const DEFAULT_MAX_CALLS = 50;

/** A call that has not exited by then is killed as a harness fault. */
export const DEFAULT_CALL_TIMEOUT_MS = 300_000;

const ANTHROPIC_ID = /^claude-[a-z0-9.-]+$/;

/** A model the live lane cannot reach: its cases are reported, not run. */
export const NOT_MEASURED_PREFIX = "NOT MEASURED";

/** A pass stops after this many model calls, calibration and retries included. */
export const readMaxCalls = (env: Env): number => {
  const raw = env.EVAL_MAX_CALLS;
  if (raw === undefined) return DEFAULT_MAX_CALLS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `EVAL_MAX_CALLS must be a positive integer, got ${JSON.stringify(raw)}`
    );
  }
  return value;
};

/** `EVAL_CALL_TIMEOUT_MS`: how long one `claude -p` call may run. */
export const readCallTimeoutMs = (env: Env): number => {
  const raw = env.EVAL_CALL_TIMEOUT_MS;
  if (raw === undefined) return DEFAULT_CALL_TIMEOUT_MS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `EVAL_CALL_TIMEOUT_MS must be a positive integer, got ${JSON.stringify(raw)}`
    );
  }
  return value;
};

/** A fraction in (0, 1]; the pass stops strictly above it. */
export const readMaxWeekly = (env: Env): number => {
  const raw = env.EVAL_MAX_WEEKLY_UTILIZATION;
  if (raw === undefined) return DEFAULT_MAX_WEEKLY_UTILIZATION;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new Error(
      `EVAL_MAX_WEEKLY_UTILIZATION must be a fraction in (0, 1], got ${JSON.stringify(raw)}`
    );
  }
  return value;
};

/**
 * `EVAL_MODEL`, Anthropic only: OpenAI and Google defaults are never measured
 * live, and the report says so rather than passing them.
 */
export const readModelId = (env: Env): string => {
  const modelId = env.EVAL_MODEL ?? OFFICIAL_CASSETTE_MODEL;
  if (!ANTHROPIC_ID.test(modelId)) {
    throw new Error(
      `${NOT_MEASURED_PREFIX}: EVAL_MODEL ${JSON.stringify(modelId)} is not an Anthropic model id; only Anthropic models are reachable live, and OpenAI and Google are not measured`
    );
  }
  return modelId;
};
