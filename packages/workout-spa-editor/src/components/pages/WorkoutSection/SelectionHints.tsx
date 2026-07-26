import { Repeat } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

type MultiSelectionHintProps = {
  selectedStepCount: number;
  onCreateRepetitionBlock: () => void;
};

export function MultiSelectionHint({
  selectedStepCount,
  onCreateRepetitionBlock,
}: MultiSelectionHintProps) {
  const t = useTranslate("editor");
  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
      <Button
        variant="primary"
        onClick={onCreateRepetitionBlock}
        aria-label={t("selection.createBlockAria")}
        data-testid="create-repetition-block-button"
        className="w-full sm:w-auto"
      >
        <Repeat className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("selection.createBlock", { count: selectedStepCount })}
      </Button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {t("selection.orPress")}{" "}
        <kbd className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-700">
          {t("selection.ctrlG")}
        </kbd>
      </span>
    </div>
  );
}

export function SingleSelectionHint() {
  const t = useTranslate("editor");
  return (
    <p
      className="text-xs text-gray-500 dark:text-gray-400"
      data-testid="selection-hint"
    >
      {t("selection.ctrlClickHint")}
    </p>
  );
}
