import { useTranslate } from "../../../i18n/use-translate";
import { Input } from "../../atoms/Input/Input";

const DURATION_TYPES = ["time", "distance", "open"] as const;

type DurationTypeSelectProps = {
  value: "time" | "distance" | "open";
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
};

export function DurationTypeSelect({
  value,
  onChange,
  disabled,
}: DurationTypeSelectProps) {
  const t = useTranslate("editor");
  return (
    <Input
      variant="select"
      label={t("durationPicker.typeLabel")}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={DURATION_TYPES.map((type) => ({
        value: type,
        label: t(`duration.${type}`),
      }))}
      aria-label={t("durationPicker.typeAria")}
    />
  );
}
