import { StepEditorActions } from "./StepEditorActions";
import { DurationPicker } from "../../molecules/DurationPicker/DurationPicker";
import { StepNotesEditor } from "../../molecules/StepNotesEditor";
import { TargetPicker } from "../../molecules/TargetPicker/TargetPicker";
import type { Duration, Target } from "../../../types/krd";

type StepEditorContentProps = {
  stepIndex: number;
  duration: Duration;
  target: Target;
  notes: string;
  durationError: string;
  targetError: string;
  hasErrors: boolean;
  onDurationChange: (duration: Duration | null) => void;
  onTargetChange: (target: Target | null) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const StepEditorContent = ({
  stepIndex,
  duration,
  target,
  notes,
  durationError,
  targetError,
  hasErrors,
  onDurationChange,
  onTargetChange,
  onNotesChange,
  onSave,
  onCancel,
}: StepEditorContentProps) => {
  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Edit Step {stepIndex + 1}
      </h2>
      <div className="space-y-6">
        <DurationPicker
          value={duration}
          onChange={onDurationChange}
          error={durationError}
        />
        <TargetPicker
          value={target}
          onChange={onTargetChange}
          error={targetError}
        />
        <StepNotesEditor value={notes} onChange={onNotesChange} />
        <StepEditorActions
          hasErrors={hasErrors}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    </>
  );
};
