import type { WorkoutStep } from "../../../types/krd";
import { StepEditor } from "../../organisms/StepEditor/StepEditor";

type WorkoutSectionEditorProps = {
  isEditing: boolean;
  selectedStep: WorkoutStep | null;
  onSave: (step: WorkoutStep) => void;
  onCancel: () => void;
};

export function WorkoutSectionEditor({
  isEditing,
  selectedStep,
  onSave,
  onCancel,
}: WorkoutSectionEditorProps) {
  if (!isEditing || !selectedStep) {
    return null;
  }

  return <StepEditor step={selectedStep} onSave={onSave} onCancel={onCancel} />;
}
