import type { Logger } from "@kaiord/core";

import {
  DEFAULT_BASE_DELAY_MS,
  DEFAULT_MAX_DELAY_MS,
  DEFAULT_MAX_RETRIES,
  isRetryable,
} from "./retry-policy";
import type { FetchFn } from "./types";

export type RetryOptions = {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  randomFn?: () => number;
  logger?: Logger;
};

type ResolvedOptions = Required<Omit<RetryOptions, "logger">> & {
  logger?: Logger;
};

const computeDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  randomFn: () => number
): number => randomFn() * Math.min(maxDelay, baseDelay * 2 ** attempt);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitAndLog = (
  options: ResolvedOptions,
  attempt: number,
  message: string,
  info: Record<string, unknown>
): Promise<void> => {
  const delay = computeDelay(
    attempt,
    options.baseDelay,
    options.maxDelay,
    options.randomFn
  );
  options.logger?.debug(message, { ...info, delay: Math.round(delay) });
  return sleep(delay);
};

const handleRetryableResponse = async (
  attempt: number,
  response: Response,
  options: ResolvedOptions
): Promise<boolean> => {
  if (attempt < options.maxRetries && isRetryable(response.status)) {
    await waitAndLog(options, attempt, "Retrying request", {
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
  options: ResolvedOptions
): Promise<boolean> => {
  if (attempt < options.maxRetries && error instanceof TypeError) {
    await waitAndLog(options, attempt, "Retrying request after network error", {
      attempt: attempt + 1,
      error: (error as Error).message,
    });
    return true;
  }
  return false;
};

export const withRetry = (
  fetchFn: FetchFn,
  retryOptions?: RetryOptions
): FetchFn => {
  const options: ResolvedOptions = {
    maxRetries: retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES,
    baseDelay: retryOptions?.baseDelay ?? DEFAULT_BASE_DELAY_MS,
    maxDelay: retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY_MS,
    randomFn: retryOptions?.randomFn ?? Math.random,
    logger: retryOptions?.logger,
  };

  return async (input, init?) => {
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        const response = await fetchFn(input, init);
        if (await handleRetryableResponse(attempt, response, options)) continue;
        return response;
      } catch (error) {
        if (await handleRetryableError(attempt, error, options)) continue;
        throw error;
      }
    }
    /* istanbul ignore next -- unreachable */
    throw new Error("Unexpected retry exhaustion");
  };
};
