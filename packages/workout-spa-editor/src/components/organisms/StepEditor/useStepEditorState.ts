import { useState } from "react";
import type { Duration, Target, WorkoutStep } from "../../../types/krd";

export const useStepEditorState = (step: WorkoutStep | null) => {
  const [duration, setDuration] = useState<Duration>(
    step?.duration || { type: "time", seconds: 300 }
  );
  const [target, setTarget] = useState<Target>(
    step?.target || { type: "open" }
  );
  const [notes, setNotes] = useState<string>(step?.notes || "");
  const [durationError, setDurationError] = useState<string>("");
  const [targetError, setTargetError] = useState<string>("");

  return {
    duration,
    setDuration,
    target,
    setTarget,
    notes,
    setNotes,
    durationError,
    setDurationError,
    targetError,
    setTargetError,
  };
};
