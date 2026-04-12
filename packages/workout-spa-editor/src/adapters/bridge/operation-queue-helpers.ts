/**
 * Operation Queue Helpers
 *
 * Rate limiting, backoff, and delay utilities.
 */

import type { QueuedOperation } from "./operation-queue";

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;
const MAX_RETRIES = 5;

type RateLimitError = Error & { status?: number };

function isRateLimited(err: unknown): boolean {
  return (err as RateLimitError)?.status === 429;
}

export const delay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export async function executeWithBackoff<T>(
  op: QueuedOperation<T>
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await op.execute();
    } catch (err) {
      if (!isRateLimited(err)) throw err;
      attempt += 1;
      if (attempt >= MAX_RETRIES) throw err;
      const wait = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
      await delay(wait);
    }
  }
}
