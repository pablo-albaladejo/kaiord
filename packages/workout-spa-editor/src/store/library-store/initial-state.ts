/**
 * Library Store Initial State
 */

import { loadLibrary } from "../../utils/library-storage";
import type { WorkoutTemplate } from "../../types/workout-library";

export function loadInitialState(): {
  templates: Array<WorkoutTemplate>;
} {
  const result = loadLibrary();
  if (result.success) {
    return {
      templates: result.data.templates,
    };
  }
  return {
    templates: [],
  };
}
