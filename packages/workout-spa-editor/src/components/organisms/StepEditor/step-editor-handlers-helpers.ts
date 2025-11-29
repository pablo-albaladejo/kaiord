import type { Duration, Target, WorkoutStep } from "../../../types/krd";

export function createUpdatedStep(
  step: WorkoutStep,
  duration: Duration,
  target: Target,
  notes: string
): WorkoutStep {
  return {
    ...step,
    duration,
    durationType: duration.type,
    target,
    targetType: target.type,
    notes: notes || undefined,
  };
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
