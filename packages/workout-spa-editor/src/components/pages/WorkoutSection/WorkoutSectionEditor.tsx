import type { WorkoutStep } from "../../../types/krd";
import { StepEditor } from "../../organisms/StepEditor/StepEditor";

type WorkoutSectionEditorProps = {
  /** The row the list is currently rendering. */
  itemId: string;
  selectedStepId: string | null;
  isEditing: boolean;
  selectedStep: WorkoutStep | null;
  onSave: (step: WorkoutStep) => void;
  onCancel: () => void;
};

/**
 * The step form, rendered by the list directly beneath the row it edits.
 * It used to be a card above the list, which is why changing one target
 * cost five steps: the form opened somewhere else and the step it belonged
 * to left the viewport.
 */
export function WorkoutSectionEditor({
  itemId,
  selectedStepId,
  isEditing,
  selectedStep,
  onSave,
  onCancel,
}: WorkoutSectionEditorProps) {
  if (itemId !== selectedStepId || !isEditing || !selectedStep) return null;

  return <StepEditor step={selectedStep} onSave={onSave} onCancel={onCancel} />;
}
