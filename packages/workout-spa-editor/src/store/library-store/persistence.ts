/**
 * Library Store Persistence
 */

import { saveLibrary } from "../../utils/library-storage";
import type { WorkoutTemplate } from "../../types/workout-library";

export function persistState(templates: Array<WorkoutTemplate>): void {
  const error = saveLibrary(templates);
  if (error) {
    console.error("Failed to save library:", error.message);
  }
}
