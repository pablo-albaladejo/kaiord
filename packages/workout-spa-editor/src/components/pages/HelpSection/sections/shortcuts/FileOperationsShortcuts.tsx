/**
 * FileOperationsShortcuts Component
 *
 * File operation keyboard shortcuts.
 */

import { Save } from "lucide-react";

import { useTranslate } from "../../../../../i18n/use-translate";
import { ShortcutRow } from "../../components/ShortcutRow";

export function FileOperationsShortcuts() {
  const t = useTranslate("help");
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        {t("shortcuts.file.heading")}
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<Save className="h-4 w-4" />}
          keys={["Ctrl", "S"]}
          macKeys={["Cmd", "S"]}
          description={t("shortcuts.file.save")}
        />
      </div>
    </div>
  );
}
