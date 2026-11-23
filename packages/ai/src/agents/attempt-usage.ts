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

type Billed = { usage: AiUsage; estimated?: true };

const BILLED = new WeakMap<object, Billed>();

/**
 * Tags a failed attempt's error with the usage the Provider billed for it
 * (or, `estimated`, the estimate for an attempt cut before it reported
 * any), without wrapping it, so retry classification still sees the real
 * error.
 */
export const withUsage = <E>(
  error: E,
  usage: AiUsage | undefined,
  estimated = false
): E => {
  if (usage && typeof error === "object" && error !== null)
    BILLED.set(error, { usage, ...(estimated ? { estimated: true } : {}) });
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
  const billed =
    typeof error === "object" && error !== null ? BILLED.get(error) : undefined;
  return { outcome: outcomeOf(error, aborted), ...billed };
};
