import { useTranslate } from "../../../i18n/use-translate";
import { Input } from "../../atoms/Input/Input";
import { TARGET_TYPE_OPTIONS } from "./constants";

type TargetTypeSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
};

export const TargetTypeSelect = ({
  value,
  onChange,
  disabled,
}: TargetTypeSelectProps) => {
  const t = useTranslate("targets");

  return (
    <Input
      variant="select"
      label={t("typeLabel")}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={TARGET_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(`type.${opt.value}`),
      }))}
      aria-label={t("typeAria")}
    />
  );
};
