import { useEffect, useState } from "react";

import type { KRD } from "../../../types/krd";
import { getStructuredWorkout } from "../../../utils/structured-workout";

/** Each open proposes the workout's current name; the user edits from there. */
export function useProposedName(workout: KRD, open: boolean) {
  const [name, setName] = useState("");
  const workoutName = getStructuredWorkout(workout)?.name ?? "";

  useEffect(() => {
    if (open) setName(workoutName);
  }, [open, workoutName]);

  return [name, setName] as const;
}
