import type { WorkoutStep } from "../../../types/krd";
import { StepEditorContent } from "./StepEditorContent";
import { useStepEditorHandlers } from "./useStepEditorHandlers";
import { useStepEditorState } from "./useStepEditorState";

export type StepEditorProps = {
  step: WorkoutStep | null;
  onSave: (step: WorkoutStep) => void;
  onCancel: () => void;
  className?: string;
};

export const StepEditor = ({
  step,
  onSave,
  onCancel,
  className = "",
}: StepEditorProps) => {
  const state = useStepEditorState(step);

  const handlers = useStepEditorHandlers({
    step,
    duration: state.duration,
    target: state.target,
    durationError: state.durationError,
    targetError: state.targetError,
    setDuration: state.setDuration,
    setTarget: state.setTarget,
    setDurationError: state.setDurationError,
    setTargetError: state.setTargetError,
    onSave,
    onCancel,
  });

  if (!step) {
    return null;
  }

  const hasErrors = Boolean(state.durationError || state.targetError);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <StepEditorContent
        stepIndex={step.stepIndex}
        duration={state.duration}
        target={state.target}
        durationError={state.durationError}
        targetError={state.targetError}
        hasErrors={hasErrors}
        onDurationChange={handlers.handleDurationChange}
        onTargetChange={handlers.handleTargetChange}
        onSave={handlers.handleSave}
        onCancel={handlers.handleCancel}
      />
    </div>
  );
};
