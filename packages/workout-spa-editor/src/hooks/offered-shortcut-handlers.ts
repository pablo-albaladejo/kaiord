import {
  SHORTCUT_CATALOG,
  type ShortcutDef,
} from "../constants/shortcut-catalog";
import type { ActiveCapabilities } from "../lib/capabilities/resolve-capabilities";
import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

/**
 * The handlers whose shortcut the athlete is offered: a binding an off
 * Capability owns does nothing, as if it were not bound.
 */
export const offeredShortcutHandlers = (
  handlers: KeyboardShortcutHandlers,
  offers: ActiveCapabilities["offers"],
  rows: ReadonlyArray<ShortcutDef> = SHORTCUT_CATALOG
): KeyboardShortcutHandlers => {
  const withheld = new Set(
    rows
      .filter((row) => row.handlerKey !== null && !offers("shortcut", row.id))
      .map((row) => row.handlerKey)
  );
  return Object.fromEntries(
    Object.entries(handlers).filter(
      ([key]) => !withheld.has(key as keyof KeyboardShortcutHandlers)
    )
  ) as KeyboardShortcutHandlers;
};
