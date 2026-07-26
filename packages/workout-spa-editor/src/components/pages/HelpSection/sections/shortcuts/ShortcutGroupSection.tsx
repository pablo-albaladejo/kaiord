/**
 * ShortcutGroupSection Component
 *
 * Renders one shortcut group straight from the catalog.
 */

import type { ShortcutGroup } from "../../../../../constants/shortcut-catalog";
import { SHORTCUT_CATALOG } from "../../../../../constants/shortcut-catalog";
import { useTranslate } from "../../../../../i18n/use-translate";
import { ShortcutRow } from "../../components/ShortcutRow";

type ShortcutGroupSectionProps = {
  group: ShortcutGroup;
};

export function ShortcutGroupSection({ group }: ShortcutGroupSectionProps) {
  const t = useTranslate("help");

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        {t(`shortcuts.${group}.heading`)}
      </h3>
      <div className="space-y-2">
        {SHORTCUT_CATALOG.filter((def) => def.group === group).map((def) => (
          <ShortcutRow key={def.id} def={def} />
        ))}
      </div>
    </div>
  );
}
