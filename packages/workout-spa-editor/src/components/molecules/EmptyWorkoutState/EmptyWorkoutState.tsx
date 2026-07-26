import { ListPlus } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

export type EmptyWorkoutStateProps = {
  onAddStep: () => void;
};

export function EmptyWorkoutState({ onAddStep }: EmptyWorkoutStateProps) {
  const t = useTranslate("editor");
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="empty-workout-state"
    >
      <ListPlus
        className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        {t("empty.title")}
      </h3>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
        {t("empty.description")}
      </p>
      <Button
        variant="primary"
        onClick={onAddStep}
        aria-label={t("empty.addFirstStepAria")}
        data-testid="add-first-step-button"
      >
        <ListPlus className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("actions.addStep")}
      </Button>
    </div>
  );
}
