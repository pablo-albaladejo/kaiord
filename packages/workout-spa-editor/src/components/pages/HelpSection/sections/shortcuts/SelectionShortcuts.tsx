/**
 * SelectionShortcuts Component
 *
 * Selection keyboard shortcuts.
 */

import { Zap } from "lucide-react";

import { useTranslate } from "../../../../../i18n/use-translate";
import { ShortcutRow } from "../../components/ShortcutRow";

export function SelectionShortcuts() {
  const t = useTranslate("help");
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        {t("shortcuts.selection.heading")}
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<Zap className="h-4 w-4" />}
          keys={["Ctrl", "A"]}
          macKeys={["Cmd", "A"]}
          description={t("shortcuts.selection.selectAll")}
        />
        <ShortcutRow
          icon={<Zap className="h-4 w-4" />}
          keys={["Esc"]}
          description={t("shortcuts.selection.clear")}
        />
      </div>
    </div>
  );
}
