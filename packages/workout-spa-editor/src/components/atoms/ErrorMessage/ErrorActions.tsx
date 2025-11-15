import { Button } from "../Button/Button";

type ErrorActionsProps = {
  onRetry?: () => void;
  onDismiss?: () => void;
};

export const ErrorActions = ({ onRetry, onDismiss }: ErrorActionsProps) => {
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
          Try Again
        </Button>
      )}
      {onDismiss && (
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
        >
          Dismiss
        </Button>
      )}
    </div>
  );
};
