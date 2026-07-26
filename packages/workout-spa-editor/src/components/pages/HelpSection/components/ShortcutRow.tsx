/**
 * ShortcutRow Component
 *
 * Displays one catalog shortcut: its translated description and key chips.
 */

import type { ShortcutDef } from "../../../../constants/shortcut-catalog";
import { useTranslate } from "../../../../i18n/use-translate";
import { KeyChips } from "../../../atoms/KeyChips";

type ShortcutRowProps = {
  def: ShortcutDef;
};

export function ShortcutRow({ def }: ShortcutRowProps) {
  const t = useTranslate("help");

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600 dark:text-gray-400">
        {t(def.labelKey)}
      </span>
      <KeyChips def={def} />
    </div>
  );
}
