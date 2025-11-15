import type { Duration, Target } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { DurationPicker } from "../../molecules/DurationPicker/DurationPicker";
import { TargetPicker } from "../../molecules/TargetPicker/TargetPicker";

type StepEditorContentProps = {
  stepIndex: number;
  duration: Duration;
  target: Target;
  durationError: string;
  targetError: string;
  hasErrors: boolean;
  onDurationChange: (duration: Duration | null) => void;
  onTargetChange: (target: Target | null) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const StepEditorContent = ({
  stepIndex,
  duration,
  target,
  durationError,
  targetError,
  hasErrors,
  onDurationChange,
  onTargetChange,
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

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={hasErrors}
            aria-label="Save step changes"
          >
            Save
          </Button>
        </div>
      </div>
    </>
  );
};
