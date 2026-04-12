/**
 * Operation Queue
 *
 * Per-bridge queue with concurrency 1, configurable delay,
 * exponential backoff on 429, and 60 ops/hour hard cap.
 *
 * NOTE: The hourly counter uses an in-memory rolling window.
 * For page-refresh survival, persist in Dexie syncState.
 * Accepted tradeoff for v1: refresh resets the counter.
 */

import { delay, executeWithBackoff } from "./operation-queue-helpers";

export type QueuedOperation<T> = {
  bridgeId: string;
  execute: () => Promise<T>;
};

const MAX_OPS_PER_HOUR = 60;
const ONE_HOUR_MS = 60 * 60 * 1_000;

function getCount(ts: Map<string, number[]>, id: string): number {
  const cutoff = Date.now() - ONE_HOUR_MS;
  const arr = ts.get(id) ?? [];
  const recent = arr.filter((t) => t > cutoff);
  ts.set(id, recent);
  return recent.length;
}

export function createOperationQueue(delayMs = 500) {
  const processing = new Map<string, Promise<void>>();
  const timestamps = new Map<string, number[]>();

  function enqueue<T>(op: QueuedOperation<T>): Promise<T> {
    const { bridgeId } = op;

    if (getCount(timestamps, bridgeId) >= MAX_OPS_PER_HOUR) {
      return Promise.reject(
        new Error(
          `Rate limit reached for bridge ${bridgeId}. ` + `Try again later.`
        )
      );
    }

    const prev = processing.get(bridgeId) ?? Promise.resolve();
    let resolve: (v: T) => void;
    let reject: (e: unknown) => void;
    const result = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const chain = prev
      .then(() => delay(delayMs))
      .then(() => executeWithBackoff(op))
      .then((v) => {
        const arr = timestamps.get(bridgeId) ?? [];
        arr.push(Date.now());
        timestamps.set(bridgeId, arr);
        resolve!(v);
      })
      .catch((err: unknown) => reject!(err));

    processing.set(bridgeId, chain);
    return result;
  }

  return {
    enqueue,
    getHourlyCount: (id: string) => getCount(timestamps, id),
    /** Exposed for testing only */
    _timestamps: timestamps,
  };
}

export type OperationQueue = ReturnType<typeof createOperationQueue>;
