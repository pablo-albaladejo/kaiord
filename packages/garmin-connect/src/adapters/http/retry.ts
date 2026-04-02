import type { FetchFn } from "./types";
import type { Logger } from "@kaiord/core";

export type RetryOptions = {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  randomFn?: () => number;
  logger?: Logger;
};

type ResolvedOptions = {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  randomFn: () => number;
  logger?: Logger;
};

const isRetryable = (status: number): boolean =>
  status === 429 || (status >= 500 && status <= 599);

const computeDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  randomFn: () => number
): number => randomFn() * Math.min(maxDelay, baseDelay * 2 ** attempt);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitAndLog = (
  opts: ResolvedOptions,
  attempt: number,
  message: string,
  info: Record<string, unknown>
): Promise<void> => {
  const delay = computeDelay(
    attempt,
    opts.baseDelay,
    opts.maxDelay,
    opts.randomFn
  );
  opts.logger?.debug(message, { ...info, delay: Math.round(delay) });
  return sleep(delay);
};

const handleRetryableResponse = async (
  attempt: number,
  response: Response,
  opts: ResolvedOptions
): Promise<boolean> => {
  if (attempt < opts.maxRetries && isRetryable(response.status)) {
    await waitAndLog(opts, attempt, "Retrying request", {
      attempt: attempt + 1,
      status: response.status,
    });
    return true;
  }
  return false;
};

const handleRetryableError = async (
  attempt: number,
  error: unknown,
  opts: ResolvedOptions
): Promise<boolean> => {
  if (attempt < opts.maxRetries && error instanceof TypeError) {
    await waitAndLog(opts, attempt, "Retrying request after network error", {
      attempt: attempt + 1,
      error: (error as Error).message,
    });
    return true;
  }
  return false;
};

export const withRetry = (
  fetchFn: FetchFn,
  options?: RetryOptions
): FetchFn => {
  const opts: ResolvedOptions = {
    maxRetries: options?.maxRetries ?? 3,
    baseDelay: options?.baseDelay ?? 1000,
    maxDelay: options?.maxDelay ?? 10000,
    randomFn: options?.randomFn ?? Math.random,
    logger: options?.logger,
  };

  return async (input, init?) => {
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const response = await fetchFn(input, init);
        if (await handleRetryableResponse(attempt, response, opts)) continue;
        return response;
      } catch (error) {
        if (await handleRetryableError(attempt, error, opts)) continue;
        throw error;
      }
    }
    /* istanbul ignore next -- unreachable */
    throw new Error("Unexpected retry exhaustion");
  };
};
