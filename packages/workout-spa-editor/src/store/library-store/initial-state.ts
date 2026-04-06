/**
 * Library Store Initial State
 */

import type { WorkoutTemplate } from "../../types/workout-library";
import { loadLibrary } from "../../utils/library-storage";

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
