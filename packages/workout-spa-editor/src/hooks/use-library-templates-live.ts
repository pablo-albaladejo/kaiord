/**
 * useLibraryTemplatesLive — reactive read hook for the workout library.
 *
 * Binds to the production Dexie singleton `db` (D1.3). In tests the
 * same `db` is backed by fake-indexeddb (D5.1) so the hook re-fires
 * on writes through `PersistencePort.templates.put` without any
 * test-only shim or module mock.
 *
 * Returns `undefined` while loading on first mount; consumers SHALL
 * treat that as the loading state (skeleton or "Loading…") and not
 * confuse it with the empty-list state (`[]`).
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { WorkoutTemplate } from "../types/workout-library";

export const useLibraryTemplatesLive = (): WorkoutTemplate[] | undefined =>
  useLiveQuery<WorkoutTemplate[]>(
    () => db.table<WorkoutTemplate>("templates").toArray(),
    []
  );
