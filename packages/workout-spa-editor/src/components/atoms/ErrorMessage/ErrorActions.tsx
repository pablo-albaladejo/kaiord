import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../Button/Button";

type ErrorActionsProps = {
  onRetry?: () => void;
  onDismiss?: () => void;
};

export const ErrorActions = ({ onRetry, onDismiss }: ErrorActionsProps) => {
  const t = useTranslate("common");
  if (!onRetry && !onDismiss) return null;

  return (
    <div className="mt-3 flex gap-2">
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="secondary"
          size="sm"
          className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
        >
          {t("actions.tryAgain")}
        </Button>
      )}
      {onDismiss && (
        <Button
          onClick={onDismiss}
          variant="tertiary"
          size="sm"
          className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
        >
          {t("actions.dismiss")}
        </Button>
      )}
    </div>
  );
};
