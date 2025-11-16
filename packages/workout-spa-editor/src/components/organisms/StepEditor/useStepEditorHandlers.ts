import type { Duration, Target, WorkoutStep } from "../../../types/krd";
import {
  createUpdatedStep,
  resetEditorState,
} from "./step-editor-handlers-helpers";

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
    if (newDuration) setDuration(newDuration);
  };

  const handleTargetChange = (newTarget: Target | null) => {
    if (newTarget) setTarget(newTarget);
  };

  const handleSave = () => {
    if (durationError || targetError || !step) return;
    onSave(createUpdatedStep(step, duration, target));
  };

  const handleCancel = () => {
    resetEditorState(
      step,
      setDuration,
      setTarget,
      setDurationError,
      setTargetError
    );
    onCancel();
  };

  return {
    handleDurationChange,
    handleTargetChange,
    handleSave,
    handleCancel,
  };
};
