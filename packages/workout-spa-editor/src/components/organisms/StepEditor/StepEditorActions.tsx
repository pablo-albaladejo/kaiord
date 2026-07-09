import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("editor");
  return (
    <div className="flex flex-col items-end gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
      {hasErrors && (
        <p
          id={ERROR_MESSAGE_ID}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {t("stepEditor.fixErrors")}
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {t("stepEditor.cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={hasErrors}
          aria-label={t("stepEditor.saveAria")}
          aria-describedby={hasErrors ? ERROR_MESSAGE_ID : undefined}
          title={
            hasErrors
              ? t("stepEditor.fixErrorsTitle")
              : t("stepEditor.saveTitle")
          }
        >
          {t("stepEditor.save")}
        </Button>
      </div>
    </div>
  );
}
