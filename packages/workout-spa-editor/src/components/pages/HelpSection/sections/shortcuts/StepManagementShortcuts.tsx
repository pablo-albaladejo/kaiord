/**
 * StepManagementShortcuts Component
 *
 * Step management keyboard shortcuts.
 */

import { ArrowDown, ArrowUp, Layers } from "lucide-react";

import { useTranslate } from "../../../../../i18n/use-translate";
import { ShortcutRow } from "../../components/ShortcutRow";

export function StepManagementShortcuts() {
  const t = useTranslate("help");
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        {t("shortcuts.step.heading")}
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<ArrowUp className="h-4 w-4" />}
          keys={["Alt", "↑"]}
          description={t("shortcuts.step.moveUp")}
        />
        <ShortcutRow
          icon={<ArrowDown className="h-4 w-4" />}
          keys={["Alt", "↓"]}
          description={t("shortcuts.step.moveDown")}
        />
        <ShortcutRow
          icon={<Layers className="h-4 w-4" />}
          keys={["Ctrl", "G"]}
          macKeys={["Cmd", "G"]}
          description={t("shortcuts.step.createBlock")}
        />
        <ShortcutRow
          icon={<Layers className="h-4 w-4" />}
          keys={["Ctrl", "Shift", "G"]}
          macKeys={["Cmd", "Shift", "G"]}
          description={t("shortcuts.step.ungroup")}
        />
      </div>
    </div>
  );
}
