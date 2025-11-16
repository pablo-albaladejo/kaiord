import { useState } from "react";
import type { Duration, Target, WorkoutStep } from "../../../types/krd";

export const useStepEditorState = (step: WorkoutStep | null) => {
  const [duration, setDuration] = useState<Duration>(
    step?.duration || { type: "time", seconds: 300 }
  );
  const [target, setTarget] = useState<Target>(
    step?.target || { type: "open" }
  );
  const [durationError, setDurationError] = useState<string>("");
  const [targetError, setTargetError] = useState<string>("");

  return {
    duration,
    setDuration,
    target,
    setTarget,
    durationError,
    setDurationError,
    targetError,
    setTargetError,
  };
};
