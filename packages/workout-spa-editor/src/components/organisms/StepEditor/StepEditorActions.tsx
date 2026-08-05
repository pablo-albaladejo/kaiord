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
  // "Save" left with the other six verbs: a local-first editor already kept
  // the change, so the button closes the form rather than asking permission.
  return (
    <div className="flex flex-col gap-2 border-t border-edge-soft pt-4">
      {hasErrors && (
        <p
          id={ERROR_MESSAGE_ID}
          className="text-sm text-[var(--danger-text)]"
          role="alert"
        >
          {t("stepEditor.fixErrors")}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
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
        <Button variant="tertiary" size="sm" onClick={onCancel}>
          {t("stepEditor.cancel")}
        </Button>
      </div>
    </div>
  );
}
