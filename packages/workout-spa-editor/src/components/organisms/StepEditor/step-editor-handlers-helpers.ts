import { clearNoteOrigin } from "@kaiord/core";

import type {
  Duration,
  Intensity,
  Target,
  WorkoutStep,
} from "../../../types/krd";

/** An edited note is the athlete's: it loses any AI origin it had. */
export function createUpdatedStep(
  step: WorkoutStep,
  duration: Duration,
  target: Target,
  notes: string,
  intensity: Intensity
): WorkoutStep {
  const updated: WorkoutStep = {
    ...step,
    intensity,
    duration,
    durationType: duration.type,
    target,
    targetType: target.type,
    notes: notes || undefined,
  };
  return notes === (step.notes ?? "") ? updated : clearNoteOrigin(updated);
}

export function resetEditorState(
  step: WorkoutStep | null,
  setDuration: (duration: Duration) => void,
  setTarget: (target: Target) => void,
  setNotes: (notes: string) => void,
  setDurationError: (error: string) => void,
  setTargetError: (error: string) => void
) {
  setDuration(step?.duration || { type: "time", seconds: 300 });
  setTarget(step?.target || { type: "open" });
  setNotes(step?.notes || "");
  setDurationError("");
  setTargetError("");
}
