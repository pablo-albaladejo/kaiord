/**
 * attemptLink — connect-flow use case.
 *
 * Captures `targetProfileId` from the caller (NEVER `getActiveId()`),
 * opens the platform's tab, polls ping until session is active, then
 * `linkAccount(targetProfileId, ...)`. Abort: silent, no link. Deleted
 * profile: returns `{ ok: false, reason: "profile-deleted" }`.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import {
  aborted,
  persistLinkOrDeleted,
  safeOpenExternal,
  transportError,
} from "./attempt-link-helpers";
import type { CoachingTransport } from "./coaching-transport-port";

export type AttemptLinkDeps = {
  profiles: ProfileRepository;
  transport: CoachingTransport;
  now?: () => string;
  /** Override for tests. Defaults to setTimeout-backed delay. */
  delay?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
  maxAttempts?: number;
};

export type AttemptLinkResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "aborted"
        | "profile-deleted"
        | "session-not-active"
        | "transport-error";
      error?: string;
    };

const DEFAULT_DELAY = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const attemptLink = async (
  deps: AttemptLinkDeps,
  targetProfileId: string,
  signal?: AbortSignal
): Promise<AttemptLinkResult> => {
  if (signal?.aborted) return aborted();

  const openErr = await safeOpenExternal(deps.transport, signal);
  if (signal?.aborted) return aborted();
  if (openErr) return openErr;

  const maxAttempts = deps.maxAttempts ?? 5;
  const intervalMs = deps.pollIntervalMs ?? 2_000;
  const delay = deps.delay ?? DEFAULT_DELAY;
  const now = deps.now ?? (() => new Date().toISOString());

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) return aborted();
    await delay(intervalMs);
    if (signal?.aborted) return aborted();

    try {
      const result = await deps.transport.ping(signal);
      if (signal?.aborted) return aborted();
      if (
        result.sessionActive &&
        result.externalUserId &&
        result.externalUserName
      ) {
        return persistLinkOrDeleted(
          deps.profiles,
          deps.transport,
          targetProfileId,
          result,
          now()
        );
      }
    } catch (err) {
      if (signal?.aborted) return aborted();
      return transportError(err);
    }
  }

  return { ok: false, reason: "session-not-active" };
};
