/**
 * In-Memory SessionMatchRepository
 *
 * Test implementation backed by a Map keyed by `id`. Uniqueness invariants
 * (per profile) are enforced on `put`; `SessionAlreadyMatchedError` matches
 * the contract surfaced by the Dexie adapter.
 *
 * Same workout MAY be matched in different profiles — uniqueness is
 * scoped to `(profileId, *)`.
 */

import type { SessionMatchRepository } from "../ports/session-match-repository";
import { SessionAlreadyMatchedError } from "../types/session-match-errors";
import type { SessionMatch } from "../types/session-match";
import { appendExecutedWorkoutIdsInMemory } from "./in-memory-session-match-append-executed";

type Store = Map<string, SessionMatch>;

const findActivityConflict = (
  store: Store,
  match: SessionMatch
): SessionMatch | undefined =>
  [...store.values()].find(
    (m) =>
      m.id !== match.id &&
      m.profileId === match.profileId &&
      m.coachingActivityId === match.coachingActivityId
  );

const findWorkoutConflict = (
  store: Store,
  match: SessionMatch
): SessionMatch | undefined =>
  [...store.values()].find(
    (m) =>
      m.id !== match.id &&
      m.profileId === match.profileId &&
      m.workoutId === match.workoutId
  );

const buildReaders = (
  store: Store
): Pick<
  SessionMatchRepository,
  "getById" | "getByActivityId" | "getByWorkoutId" | "listByProfileAndWeek"
> => ({
  getById: async (id) => store.get(id),
  getByActivityId: async (profileId, coachingActivityId) =>
    [...store.values()].find(
      (m) =>
        m.profileId === profileId && m.coachingActivityId === coachingActivityId
    ),
  getByWorkoutId: async (profileId, workoutId) =>
    [...store.values()].find(
      (m) => m.profileId === profileId && m.workoutId === workoutId
    ),
  listByProfileAndWeek: async (profileId, weekStart, weekEnd) =>
    [...store.values()].filter(
      (m) =>
        m.profileId === profileId && m.date >= weekStart && m.date <= weekEnd
    ),
});

const buildWriters = (
  store: Store
): Pick<
  SessionMatchRepository,
  | "put"
  | "updateCoachingActivityId"
  | "appendExecutedWorkoutIds"
  | "delete"
  | "deleteByActivityId"
  | "deleteByWorkoutId"
  | "deleteByProfile"
> => ({
  put: async (match) => {
    if (findActivityConflict(store, match)) {
      throw new SessionAlreadyMatchedError(
        `activity ${match.coachingActivityId} already matched in profile ${match.profileId}`
      );
    }
    if (findWorkoutConflict(store, match)) {
      throw new SessionAlreadyMatchedError(
        `workout ${match.workoutId} already matched in profile ${match.profileId}`
      );
    }
    store.set(match.id, match);
  },
  updateCoachingActivityId: async (id, newCoachingActivityId) => {
    const existing = store.get(id);
    if (!existing) return;
    const next: SessionMatch = {
      ...existing,
      coachingActivityId: newCoachingActivityId,
    };
    if (findActivityConflict(store, next)) {
      throw new SessionAlreadyMatchedError(
        `activity ${next.coachingActivityId} already matched in profile ${next.profileId}`
      );
    }
    store.set(id, next);
  },
  appendExecutedWorkoutIds: async (id, workoutIds) => {
    appendExecutedWorkoutIdsInMemory(store, id, workoutIds);
  },
  delete: async (id) => {
    store.delete(id);
  },
  deleteByActivityId: async (coachingActivityId) => {
    for (const [id, m] of store.entries()) {
      if (m.coachingActivityId === coachingActivityId) store.delete(id);
    }
  },
  deleteByWorkoutId: async (workoutId) => {
    for (const [id, m] of store.entries()) {
      if (m.workoutId === workoutId) store.delete(id);
    }
  },
  deleteByProfile: async (profileId) => {
    for (const [id, m] of store.entries()) {
      if (m.profileId === profileId) store.delete(id);
    }
  },
});

export function createInMemorySessionMatchRepository(
  store: Store = new Map()
): SessionMatchRepository {
  return { ...buildReaders(store), ...buildWriters(store) };
}
