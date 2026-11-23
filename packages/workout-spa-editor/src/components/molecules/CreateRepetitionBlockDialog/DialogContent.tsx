import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { Input } from "../../atoms/Input/Input";

type DialogContentProps = {
  stepCount?: number;
  repeatCount: string;
  error: string | null;
  onRepeatCountChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export function DialogContent({
  stepCount,
  repeatCount,
  error,
  onRepeatCountChange,
  onKeyDown,
}: DialogContentProps) {
  const t = useTranslate("editor");
  const isCreatingFromSteps = stepCount !== undefined && stepCount > 0;
  return (
    <div className="p-4">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {isCreatingFromSteps
          ? t(pluralKey("block.createFromSteps", stepCount), {
              count: stepCount,
            })
          : t("block.createEmpty")}
      </p>

      <div className="space-y-2">
        <label
          htmlFor="repeat-count-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("block.repeatCountLabel")}
        </label>
        <Input
          id="repeat-count-input"
          type="number"
          min="1"
          value={repeatCount}
          onChange={(e) => onRepeatCountChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full"
          data-testid="repeat-count-input"
          autoFocus
        />
        {error && <p className="text-sm text-danger-text">{error}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("block.minRepeatHint")}
        </p>
      </div>
    </div>
  );
}
