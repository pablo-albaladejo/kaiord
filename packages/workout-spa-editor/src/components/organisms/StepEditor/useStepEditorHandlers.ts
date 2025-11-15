import type { Duration, Target, WorkoutStep } from "../../../types/krd";

type UseStepEditorHandlersParams = {
  step: WorkoutStep | null;
  duration: Duration;
  target: Target;
  durationError: string;
  targetError: string;
  setDuration: (duration: Duration) => void;
  setTarget: (target: Target) => void;
  setDurationError: (error: string) => void;
  setTargetError: (error: string) => void;
  onSave: (step: WorkoutStep) => void;
  onCancel: () => void;
};

export const useStepEditorHandlers = ({
  step,
  duration,
  target,
  durationError,
  targetError,
  setDuration,
  setTarget,
  setDurationError,
  setTargetError,
  onSave,
  onCancel,
}: UseStepEditorHandlersParams) => {
  const handleDurationChange = (newDuration: Duration | null) => {
    if (newDuration) {
      setDuration(newDuration);
    }
  };

  const handleTargetChange = (newTarget: Target | null) => {
    if (newTarget) {
      setTarget(newTarget);
    }
  };

  const handleSave = () => {
    if (durationError || targetError || !step) {
      return;
    }

    const updatedStep: WorkoutStep = {
      ...step,
      duration,
      durationType: duration.type,
      target,
      targetType: target.type,
    };

    onSave(updatedStep);
  };

  const handleCancel = () => {
    setDuration(step?.duration || { type: "time", seconds: 300 });
    setTarget(step?.target || { type: "open" });
    setDurationError("");
    setTargetError("");
    onCancel();
  };

  return {
    handleDurationChange,
    handleTargetChange,
    handleSave,
    handleCancel,
  };
};
