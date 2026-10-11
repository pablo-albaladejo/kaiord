import { useState } from "react";

import type { KRD } from "../../../types/krd";
import { getStructuredWorkout } from "../../../utils/structured-workout";

/** Each open proposes the workout's current name; the user edits from there. */
export function useProposedName(workout: KRD, open: boolean) {
  const [name, setName] = useState("");
  const [wasOpen, setWasOpen] = useState(false);

  // Adjusted during render on the closed -> open edge only, so a workout
  // renamed while the dialog is open never overwrites the user's edit.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName(getStructuredWorkout(workout)?.name ?? "");
  }

  return [name, setName] as const;
}
