/**
 * KeyboardShortcutsSection Component
 *
 * Keyboard shortcuts reference, rendered from the shortcut catalog.
 */

import { Keyboard } from "lucide-react";

import { SHORTCUT_GROUPS } from "../../../../constants/shortcut-catalog";
import { useTranslate } from "../../../../i18n/use-translate";
import { ShortcutGroupSection } from "./shortcuts/ShortcutGroupSection";

export function KeyboardShortcutsSection() {
  const t = useTranslate("help");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Keyboard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("shortcuts.heading")}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {SHORTCUT_GROUPS.map((group) => (
          <ShortcutGroupSection key={group} group={group} />
        ))}
      </div>
    </div>
  );
}
