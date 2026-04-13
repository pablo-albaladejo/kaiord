/**
 * Library Store Persistence
 *
 * Persists templates to IndexedDB via Dexie.
 */

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutTemplate } from "../../types/workout-library";

const table = () => db.table<WorkoutTemplate>("templates");

export function persistState(templates: Array<WorkoutTemplate>): void {
  table()
    .toArray()
    .then((existing) => {
      const currentIds = new Set(templates.map((t) => t.id));
      const toDelete = existing.filter((t) => !currentIds.has(t.id));
      return Promise.all([
        ...toDelete.map((t) => table().delete(t.id)),
        table().bulkPut(templates),
      ]);
    })
    .catch((error: unknown) => {
      console.error(
        "Failed to save library:",
        error instanceof Error ? error.message : "Unknown error"
      );
    });
}
