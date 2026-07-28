import { Search } from "lucide-react";
import type { KeyboardEvent } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { INPUT_CLASS } from "./palette-styles";

export type CommandPaletteInputProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  /** False in the empty state, where the listbox is not rendered at all. */
  hasResults: boolean;
  /** Id of the active row, published instead of moving focus onto it. */
  activeOptionId?: string;
};

export function CommandPaletteInput({
  value,
  onChange,
  onKeyDown,
  hasResults,
  activeOptionId,
}: CommandPaletteInputProps) {
  const t = useTranslate("palette");

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-slate-800">
      <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
      <input
        autoFocus
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={hasResults}
        aria-controls={hasResults ? "command-palette-list" : undefined}
        aria-activedescendant={activeOptionId}
        aria-label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={INPUT_CLASS}
      />
    </div>
  );
}
