/**
 * In-Memory AutoMatchDismissalRepository — keyed by composite
 * `${profileId}:${weekStart}`.
 *
 * Mirrors the Dexie adapter's PK shape; the application layer interprets
 * the 24h expiry, this repository is value-storage only.
 */

import type { AutoMatchDismissalRepository } from "../ports/auto-match-dismissal-repository";
import type { AutoMatchDismissal } from "../types/auto-match-dismissal";

type Store = Map<string, AutoMatchDismissal>;

const compositeKey = (profileId: string, weekStart: string): string =>
  `${profileId}:${weekStart}`;

export function createInMemoryAutoMatchDismissalRepository(
  store: Store = new Map()
): AutoMatchDismissalRepository {
  return {
    getByProfileAndWeek: async (profileId, weekStart) =>
      store.get(compositeKey(profileId, weekStart)),
    put: async (dismissal) => {
      store.set(
        compositeKey(dismissal.profileId, dismissal.weekStart),
        dismissal
      );
    },
    delete: async (profileId, weekStart) => {
      store.delete(compositeKey(profileId, weekStart));
    },
    deleteByProfile: async (profileId) => {
      for (const [key, row] of store.entries()) {
        if (row.profileId === profileId) store.delete(key);
      }
    },
  };
}
