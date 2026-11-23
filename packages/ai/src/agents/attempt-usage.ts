import { NoObjectGeneratedError } from "ai";

import type {
  AiRequest,
  AiRequestOutcome,
  AiUsage,
} from "../observability/telemetry-types";
import { AiOutputInvalidError, AiOutputTruncatedError } from "./output-errors";
import { isAbortError } from "./retry-policy";

type RawUsage = {
  inputTokens?: number;
  outputTokens?: number;
  inputTokenDetails?: {
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
};

/** Provider usage in the runtime's shape; cache counts only when reported. */
export const toUsage = (raw: RawUsage | undefined): AiUsage => {
  const details = raw?.inputTokenDetails;
  return {
    promptTokens: raw?.inputTokens ?? 0,
    completionTokens: raw?.outputTokens ?? 0,
    ...(details?.cacheReadTokens
      ? { cacheReadTokens: details.cacheReadTokens }
      : {}),
    ...(details?.cacheWriteTokens
      ? { cacheWriteTokens: details.cacheWriteTokens }
      : {}),
  };
};

const BILLED = new WeakMap<object, AiUsage>();

/**
 * Tags a failed attempt's error with the usage the Provider billed for it,
 * without wrapping it, so retry classification still sees the real error.
 */
export const withUsage = <E>(error: E, usage: AiUsage | undefined): E => {
  if (usage && typeof error === "object" && error !== null)
    BILLED.set(error, usage);
  return error;
};

/** Usage carried by an SDK error that parsed the output itself. */
export const sdkErrorUsage = (error: unknown): AiUsage | undefined =>
  NoObjectGeneratedError.isInstance(error) && error.usage
    ? toUsage(error.usage)
    : undefined;

const outcomeOf = (error: unknown, aborted: boolean): AiRequestOutcome => {
  if (aborted || isAbortError(error)) return "stopped";
  if (error instanceof AiOutputTruncatedError) return "truncated";
  if (error instanceof AiOutputInvalidError) return "invalid";
  return "error";
};

/** The request a failed attempt made; no `usage` when none was reported. */
export const failedRequest = (error: unknown, aborted: boolean): AiRequest => {
  const usage =
    typeof error === "object" && error !== null ? BILLED.get(error) : undefined;
  return { outcome: outcomeOf(error, aborted), ...(usage ? { usage } : {}) };
};

const total = (requests: readonly AiRequest[], field: keyof AiUsage): number =>
  requests.reduce((sum, r) => sum + (r.usage?.[field] ?? 0), 0);

/** The run's usage: every request summed, cache counts only when non-zero. */
export const sumUsage = (requests: readonly AiRequest[]): AiUsage => {
  const cacheRead = total(requests, "cacheReadTokens");
  const cacheWrite = total(requests, "cacheWriteTokens");
  return {
    promptTokens: total(requests, "promptTokens"),
    completionTokens: total(requests, "completionTokens"),
    ...(cacheRead > 0 ? { cacheReadTokens: cacheRead } : {}),
    ...(cacheWrite > 0 ? { cacheWriteTokens: cacheWrite } : {}),
  };
};
