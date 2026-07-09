import { useTranslate } from "../../../i18n/use-translate";
import { Input } from "../../atoms/Input/Input";

type TargetUnitSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
};

export const TargetUnitSelect = ({
  value,
  onChange,
  disabled,
  options,
}: TargetUnitSelectProps) => {
  const t = useTranslate("targets");

  return (
    <Input
      variant="select"
      label={t("unitLabel")}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={options.map((opt) => ({
        value: opt.value,
        label: opt.label,
      }))}
      aria-label={t("unitAria")}
    />
  );
};
