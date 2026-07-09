/**
 * TagsInput Component
 *
 * Input field for workout tags.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import { Input } from "../../../atoms/Input/Input";

type TagsInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function TagsInput({ value, onChange, disabled }: TagsInputProps) {
  const t = useTranslate("library");
  return (
    <div>
      <label
        htmlFor="workout-tags"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {t("saveDialog.tags.label")}
      </label>
      <Input
        id="workout-tags"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("saveDialog.tags.placeholder")}
        disabled={disabled}
      />
    </div>
  );
}
