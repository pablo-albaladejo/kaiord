import { Button } from "../../atoms/Button/Button";

type StepEditorActionsProps = {
  hasErrors: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function StepEditorActions({
  hasErrors,
  onSave,
  onCancel,
}: StepEditorActionsProps) {
  return (
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
  );
}
