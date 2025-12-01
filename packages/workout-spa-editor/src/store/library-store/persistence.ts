/**
 * Library Store Persistence
 */

import type { WorkoutTemplate } from "../../types/workout-library";
import { saveLibrary } from "../../utils/library-storage";

export function persistState(templates: Array<WorkoutTemplate>): void {
  const error = saveLibrary(templates);
  if (error) {
    console.error("Failed to save library:", error.message);
  }
}
