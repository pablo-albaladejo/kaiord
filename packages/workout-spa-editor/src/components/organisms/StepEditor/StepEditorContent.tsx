import { useTranslate } from "../../../i18n/use-translate";
import type { Duration, Intensity, Target } from "../../../types/krd";
import { DurationPicker } from "../../molecules/DurationPicker/DurationPicker";
import { StepNotesEditor } from "../../molecules/StepNotesEditor";
import { TargetPicker } from "../../molecules/TargetPicker/TargetPicker";
import { StepEditorActions } from "./StepEditorActions";
import { StepIntensitySelect } from "./StepIntensitySelect";

type StepEditorContentProps = {
  stepIndex: number;
  duration: Duration;
  target: Target;
  notes: string;
  intensity: Intensity;
  onIntensityChange: (intensity: Intensity) => void;
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
  intensity,
  onIntensityChange,
  durationError,
  targetError,
  hasErrors,
  onDurationChange,
  onTargetChange,
  onNotesChange,
  onSave,
  onCancel,
}: StepEditorContentProps) => {
  const t = useTranslate("editor");
  return (
    <>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {t("stepEditor.editStep", { n: stepIndex + 1 })}
      </h2>
      <div className="space-y-5" data-testid="step-editor">
        <StepIntensitySelect value={intensity} onChange={onIntensityChange} />
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
