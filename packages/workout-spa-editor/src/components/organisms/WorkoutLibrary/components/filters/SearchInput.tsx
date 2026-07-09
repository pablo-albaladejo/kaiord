/**
 * SearchInput Component
 *
 * Search input for filtering workouts.
 */

import { useTranslate } from "../../../../../i18n/use-translate";
import { Input } from "../../../../atoms/Input/Input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
  const t = useTranslate("library");
  return (
    <div>
      <Input
        type="text"
        placeholder={t("search.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
