/**
 * Library Store Initial State
 *
 * Starts with empty templates (Dexie hydrates async).
 */

import type { WorkoutTemplate } from "../../types/workout-library";

export function loadInitialState(): {
  templates: Array<WorkoutTemplate>;
} {
  return {
    templates: [],
  };
}
