import { useTranslate } from "../../../i18n/use-translate";
import { TargetPickerRangeInput } from "./TargetPickerRangeInput";

type TargetPickerRangeFieldsProps = {
  /** Pace ends are typed as m:ss. */
  clock?: boolean;
  /** Unit shown next to the bound labels, e.g. "% FTP" or "W". */
  unit?: string;
  minValue: string;
  maxValue: string;
  displayError: string;
  disabled: boolean;
  onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const TargetPickerRangeFields = ({
  clock = false,
  unit,
  minValue,
  maxValue,
  displayError,
  disabled,
  onMinChange,
  onMaxChange,
}: TargetPickerRangeFieldsProps) => {
  const t = useTranslate("targets");
  const hasError = Boolean(displayError);
  const minLabel = unit
    ? t("range.minLabelWithUnit", { unit })
    : t("range.minLabel");
  const maxLabel = unit
    ? t("range.maxLabelWithUnit", { unit })
    : t("range.maxLabel");

  return (
    <div className="space-y-3">
      <TargetPickerRangeInput
        label={minLabel}
        value={minValue}
        onChange={onMinChange}
        disabled={disabled}
        placeholder={t("range.minPlaceholder")}
        ariaLabel={t("range.minAria")}
        hasError={hasError}
        clock={clock}
      />
      <TargetPickerRangeInput
        label={maxLabel}
        value={maxValue}
        onChange={onMaxChange}
        disabled={disabled}
        placeholder={t("range.maxPlaceholder")}
        ariaLabel={t("range.maxAria")}
        hasError={hasError}
        clock={clock}
      />
      {displayError && (
        <p
          className="text-sm text-danger-text"
          role="alert"
          id="target-range-error"
        >
          {displayError}
        </p>
      )}
    </div>
  );
};
