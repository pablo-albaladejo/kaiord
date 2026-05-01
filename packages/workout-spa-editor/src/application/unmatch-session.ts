/**
 * unmatchSession — removes a SessionMatch row by id, scoped to the
 * caller's profile.
 *
 * Idempotent: deleting a missing row is a no-op (no error). The
 * profile check happens before the delete; cross-profile is rejected
 * loudly because the only legitimate way for a caller to know a
 * matchId from another profile is via a programming bug.
 */

import type { SessionMatchRepository } from "../ports/session-match-repository";
import { CrossProfileMatchError } from "../types/session-match-errors";

export type UnmatchSessionInput = {
  profileId: string;
  matchId: string;
};

export type UnmatchSessionDeps = {
  repository: SessionMatchRepository;
};

export async function unmatchSession(
  input: UnmatchSessionInput,
  deps: UnmatchSessionDeps
): Promise<void> {
  const existing = await deps.repository.getById(input.matchId);
  if (!existing) return; // idempotent
  if (existing.profileId !== input.profileId) {
    throw new CrossProfileMatchError(
      `match ${input.matchId} belongs to profile ${existing.profileId}, not ${input.profileId}`
    );
  }
  await deps.repository.delete(input.matchId);
}
