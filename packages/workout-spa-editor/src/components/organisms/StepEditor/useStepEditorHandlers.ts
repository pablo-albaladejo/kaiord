import type {
  Duration,
  Intensity,
  Target,
  WorkoutStep,
} from "../../../types/krd";
import {
  createUpdatedStep,
  resetEditorState,
} from "./step-editor-handlers-helpers";

type UseStepEditorHandlersParams = {
  step: WorkoutStep | null;
  duration: Duration;
  target: Target;
  notes: string;
  intensity: Intensity;
  durationError: string;
  targetError: string;
  setDuration: (duration: Duration) => void;
  setTarget: (target: Target) => void;
  setNotes: (notes: string) => void;
  setIntensity: (intensity: Intensity) => void;
  setDurationError: (error: string) => void;
  setTargetError: (error: string) => void;
  onSave: (step: WorkoutStep) => void;
  onCancel: () => void;
};

export const useStepEditorHandlers = ({
  step,
  duration,
  target,
  notes,
  intensity,
  durationError,
  targetError,
  setDuration,
  setTarget,
  setNotes,
  setIntensity,
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

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleSave = () => {
    if (durationError || targetError || !step) return;
    onSave(createUpdatedStep(step, duration, target, notes, intensity));
  };

  const handleCancel = () => {
    setIntensity(step?.intensity ?? "active");
    resetEditorState(
      step,
      setDuration,
      setTarget,
      setNotes,
      setDurationError,
      setTargetError
    );
    onCancel();
  };

  return {
    handleDurationChange,
    handleTargetChange,
    handleNotesChange,
    handleSave,
    handleCancel,
  };
};
