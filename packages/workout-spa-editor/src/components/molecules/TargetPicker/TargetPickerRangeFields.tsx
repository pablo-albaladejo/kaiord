import { useTranslate } from "../../../i18n/use-translate";
import { TargetPickerRangeInput } from "./TargetPickerRangeInput";

type TargetPickerRangeFieldsProps = {
  minValue: string;
  maxValue: string;
  displayError: string;
  disabled: boolean;
  onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const TargetPickerRangeFields = ({
  minValue,
  maxValue,
  displayError,
  disabled,
  onMinChange,
  onMaxChange,
}: TargetPickerRangeFieldsProps) => {
  const t = useTranslate("targets");
  const hasError = Boolean(displayError);

  return (
    <div className="space-y-3">
      <TargetPickerRangeInput
        label={t("range.minLabel")}
        value={minValue}
        onChange={onMinChange}
        disabled={disabled}
        placeholder={t("range.minPlaceholder")}
        ariaLabel={t("range.minAria")}
        hasError={hasError}
      />
      <TargetPickerRangeInput
        label={t("range.maxLabel")}
        value={maxValue}
        onChange={onMaxChange}
        disabled={disabled}
        placeholder={t("range.maxPlaceholder")}
        ariaLabel={t("range.maxAria")}
        hasError={hasError}
      />
      {displayError && (
        <p
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          id="target-range-error"
        >
          {displayError}
        </p>
      )}
    </div>
  );
};
