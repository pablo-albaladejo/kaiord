import type { ShortcutDef } from "../constants/shortcut-catalog";

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform?: string };
};

/**
 * Detect macOS from `navigator.userAgentData.platform`, falling back to the
 * user-agent string. `navigator.platform` is deprecated and is never read.
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorWithUserAgentData;
  return /mac/i.test(nav.userAgentData?.platform ?? navigator.userAgent);
}

// Module-private: `isMacPlatform()` is the one way to ask this question.
// Exporting a second, eagerly-evaluated answer lets the two disagree — most
// visibly under test stubs, where the const is frozen at import time.
const mac = isMacPlatform();

export const modifierSymbol = mac ? "⌘" : "Ctrl+";
export const shiftSymbol = mac ? "⇧" : "Shift+";
export const deleteSymbol = mac ? "⌫" : "Del";
export const ariaModifier = mac ? "Meta" : "Control";

/** Pick the key chips a shortcut renders on the current platform. */
export function formatShortcutKeys(
  def: Pick<ShortcutDef, "keys" | "macKeys">,
  mac: boolean
): ReadonlyArray<string> {
  return mac && def.macKeys ? def.macKeys : def.keys;
}
