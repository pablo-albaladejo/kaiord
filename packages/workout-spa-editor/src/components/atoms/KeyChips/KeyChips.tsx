/**
 * KeyChips Component
 *
 * Renders the `<kbd>` chips for a catalog shortcut on the current platform,
 * followed by its alias binding when it has one.
 */

import type { ShortcutDef } from "../../../constants/shortcut-catalog";
import { formatShortcutKeys, isMacPlatform } from "../../../utils/platform";

export type KeyChipsProps = {
  def: ShortcutDef;
};

const CHIP =
  "rounded-lg border border-edge bg-surface-elevated px-2 py-1 text-xs font-medium text-ink-strong";

export function KeyChips({ def }: KeyChipsProps) {
  const mac = isMacPlatform();
  const keys = formatShortcutKeys(def, mac);
  const alias = def.aliasKeys
    ? formatShortcutKeys(
        { keys: def.aliasKeys, macKeys: def.aliasMacKeys },
        mac
      )
    : null;

  return (
    <span className="flex flex-wrap items-center justify-end gap-1">
      {keys.map((key, index) => (
        <kbd key={index} className={CHIP}>
          {key}
        </kbd>
      ))}
      {alias && (
        <>
          <span className="text-xs text-ink-muted">/</span>
          {alias.map((key, index) => (
            <kbd key={index} className={CHIP}>
              {key}
            </kbd>
          ))}
        </>
      )}
    </span>
  );
}
