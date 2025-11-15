import { useState } from "react";
import type { Duration, Target, WorkoutStep } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { DurationPicker } from "../../molecules/DurationPicker/DurationPicker";
import { TargetPicker } from "../../molecules/TargetPicker/TargetPicker";

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
  const [duration, setDuration] = useState<Duration>(
    step?.duration || { type: "time", seconds: 300 }
  );
  const [target, setTarget] = useState<Target>(
    step?.target || { type: "open" }
  );
  const [durationError, setDurationError] = useState<string>("");
  const [targetError, setTargetError] = useState<string>("");

  const handleSave = () => {
    if (durationError || targetError) {
      return;
    }

    if (!step) {
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

  if (!step) {
    return null;
  }

  const hasErrors = Boolean(durationError || targetError);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Edit Step {step.stepIndex + 1}
      </h2>

      <div className="space-y-6">
        <DurationPicker
          value={duration}
          onChange={setDuration}
          error={durationError}
        />

        <TargetPicker value={target} onChange={setTarget} error={targetError} />

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={hasErrors}
            aria-label="Save step changes"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
