import { Button } from "../../atoms/Button/Button";

type StepEditorActionsProps = {
  hasErrors: boolean;
  onSave: () => void;
  onCancel: () => void;
};

const ERROR_MESSAGE_ID = "save-error-message";

export function StepEditorActions({
  hasErrors,
  onSave,
  onCancel,
}: StepEditorActionsProps) {
  return (
    <div className="flex flex-col items-end gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
      {hasErrors && (
        <p
          id={ERROR_MESSAGE_ID}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          Please fix the errors above before saving
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={hasErrors}
          aria-label="Save step changes"
          aria-describedby={hasErrors ? ERROR_MESSAGE_ID : undefined}
          title={hasErrors ? "Fix validation errors first" : "Save changes"}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
