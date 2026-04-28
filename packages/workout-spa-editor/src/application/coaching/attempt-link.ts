/**
 * attemptLink — application use case for the connect flow.
 *
 * Polls the platform's ping until the session is active (or the abort
 * signal fires), then writes the link to the captured `targetProfileId`
 * via `linkAccount`. The profileId argument is the user's intent at click
 * time — `getActiveId()` is NEVER consulted internally (race with profile
 * switches mid-poll).
 *
 * Abort semantics:
 *  - Each poll iteration checks `signal.aborted` first.
 *  - On abort, returns silently with `{ ok: false, reason: "aborted" }`.
 *    No `linkAccount` is invoked. The late ping response (if any) is
 *    discarded after `signal.aborted` becomes true.
 *
 * Profile-deletion semantics:
 *  - If `linkAccount` throws `ProfileNotFoundError`, we surface
 *    `{ ok: false, reason: "profile-deleted" }` so the caller can show
 *    a "Profile no longer exists; not linked" toast.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import { ProfileNotFoundError } from "../profile/errors";
import type { CoachingTransport } from "./coaching-transport-port";
import { linkAccount } from "./link-account";

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
  if (signal?.aborted) return { ok: false, reason: "aborted" };

  await deps.transport.openExternal();

  const maxAttempts = deps.maxAttempts ?? 5;
  const intervalMs = deps.pollIntervalMs ?? 2_000;
  const delay = deps.delay ?? DEFAULT_DELAY;
  const now = deps.now ?? (() => new Date().toISOString());

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) return { ok: false, reason: "aborted" };
    await delay(intervalMs);
    if (signal?.aborted) return { ok: false, reason: "aborted" };

    let result;
    try {
      result = await deps.transport.ping(signal);
    } catch (err) {
      if (signal?.aborted) return { ok: false, reason: "aborted" };
      return {
        ok: false,
        reason: "transport-error",
        error: err instanceof Error ? err.message : String(err),
      };
    }

    if (signal?.aborted) return { ok: false, reason: "aborted" };

    if (
      result.sessionActive &&
      result.externalUserId &&
      result.externalUserName
    ) {
      try {
        await linkAccount(deps.profiles, targetProfileId, {
          source: deps.transport.source,
          externalUserId: result.externalUserId,
          externalUserName: result.externalUserName,
          linkedAt: now(),
        });
        return { ok: true };
      } catch (err) {
        if (err instanceof ProfileNotFoundError) {
          return { ok: false, reason: "profile-deleted" };
        }
        throw err;
      }
    }
  }

  return { ok: false, reason: "session-not-active" };
};
