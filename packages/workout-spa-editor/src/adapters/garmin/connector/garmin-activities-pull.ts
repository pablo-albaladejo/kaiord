/**
 * Pacing of the read-only Garmin activities pull: at most one pull per
 * `minIntervalMs` so rapid re-syncs cannot hammer Garmin, none while one is
 * in flight (a second one answers `throttled`), and a retry with exponential
 * backoff for a transient failure of the current extension. An extension
 * one protocol behind paces and retries inside itself, so it is asked once.
 */
import type { ExtensionResponse } from "../../bridge/bridge-transport";
import { speaksPreviousProtocol } from "../../bridge/thin-bridge-request";

type PullOptions = {
  fetchOnce: () => Promise<ExtensionResponse>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
  maxAttempts?: number;
  backoffBaseMs?: number;
};

const THROTTLED: ExtensionResponse = {
  ok: true,
  data: { activities: [], disabled: false, throttled: true },
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const isTransient = (res: ExtensionResponse): boolean =>
  !res.ok && !speaksPreviousProtocol(res) && res.retryable !== false;

export const createActivitiesPull = ({
  fetchOnce,
  now = () => Date.now(),
  sleep = wait,
  minIntervalMs = 30_000,
  maxAttempts = 3,
  backoffBaseMs = 500,
}: PullOptions) => {
  let inFlight = false;
  let lastPullAt: number | null = null;

  const withBackoff = async (): Promise<ExtensionResponse> => {
    let res = await fetchOnce();
    for (
      let attempt = 1;
      attempt < maxAttempts && isTransient(res);
      attempt++
    ) {
      await sleep(backoffBaseMs * 2 ** (attempt - 1));
      res = await fetchOnce();
    }
    return res;
  };

  return async (): Promise<ExtensionResponse> => {
    if (inFlight) return THROTTLED;
    const at = now();
    if (lastPullAt !== null && at - lastPullAt < minIntervalMs)
      return THROTTLED;
    inFlight = true;
    lastPullAt = at;
    try {
      return await withBackoff();
    } finally {
      inFlight = false;
    }
  };
};
