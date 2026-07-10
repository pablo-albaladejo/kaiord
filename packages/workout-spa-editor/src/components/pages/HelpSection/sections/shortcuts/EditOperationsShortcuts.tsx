/**
 * EditOperationsShortcuts Component
 *
 * Edit operation keyboard shortcuts.
 */

import { Copy, RotateCcw, Scissors } from "lucide-react";

import { useTranslate } from "../../../../../i18n/use-translate";
import { ShortcutRow } from "../../components/ShortcutRow";

export function EditOperationsShortcuts() {
  const t = useTranslate("help");
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        {t("shortcuts.edit.heading")}
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<RotateCcw className="h-4 w-4" />}
          keys={["Ctrl", "Z"]}
          macKeys={["Cmd", "Z"]}
          description={t("shortcuts.edit.undo")}
        />
        <ShortcutRow
          icon={<RotateCcw className="h-4 w-4 rotate-180" />}
          keys={["Ctrl", "Y"]}
          macKeys={["Cmd", "Y"]}
          description={t("shortcuts.edit.redo")}
        />
        <ShortcutRow
          icon={<Copy className="h-4 w-4" />}
          keys={["Ctrl", "C"]}
          macKeys={["Cmd", "C"]}
          description={t("shortcuts.edit.copy")}
        />
        <ShortcutRow
          icon={<Scissors className="h-4 w-4" />}
          keys={["Ctrl", "V"]}
          macKeys={["Cmd", "V"]}
          description={t("shortcuts.edit.paste")}
        />
      </div>
    </div>
  );
}
