/**
 * ShortcutSheetGroup Component
 *
 * One catalog group rendered as a column of the shortcut sheet.
 */

import type { ShortcutGroup } from "../../../constants/shortcut-catalog";
import { SHORTCUT_CATALOG } from "../../../constants/shortcut-catalog";
import { useTranslate } from "../../../i18n/use-translate";
import { KeyChips } from "../../atoms/KeyChips";

type ShortcutSheetGroupProps = {
  group: ShortcutGroup;
};

export function ShortcutSheetGroup({ group }: ShortcutSheetGroupProps) {
  const t = useTranslate("help");

  return (
    <section aria-labelledby={`shortcut-group-${group}`}>
      <h3
        id={`shortcut-group-${group}`}
        className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-muted"
      >
        {t(`shortcuts.${group}.heading`)}
      </h3>
      <ul className="space-y-1.5">
        {SHORTCUT_CATALOG.filter((def) => def.group === group).map((def) => (
          <li
            key={def.id}
            className="flex items-center justify-between gap-3 text-sm text-ink-body"
          >
            <span>{t(def.labelKey)}</span>
            <KeyChips def={def} />
          </li>
        ))}
      </ul>
    </section>
  );
}
