/**
 * Library Page Hooks
 *
 * useLiveQuery for templates from Dexie.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutTemplate } from "../../types/workout-library";

export function useLibraryTemplates(): WorkoutTemplate[] | undefined {
  return useLiveQuery(
    () => db.table<WorkoutTemplate>("templates").toArray(),
    []
  );
}
