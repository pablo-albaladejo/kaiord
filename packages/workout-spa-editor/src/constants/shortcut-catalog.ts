import type { KeyboardShortcutHandlers } from "../hooks/keyboard-shortcut-handlers";
import { EDIT_SHORTCUT_ROWS } from "./shortcut-rows-edit";
import { GLOBAL_SHORTCUT_ROWS } from "./shortcut-rows-global";
import { STEP_SHORTCUT_ROWS } from "./shortcut-rows-steps";

export type ShortcutGroup = "file" | "selection" | "edit" | "steps" | "help";

export type ShortcutDef = {
  id: string;
  group: ShortcutGroup;
  keys: ReadonlyArray<string>;
  macKeys?: ReadonlyArray<string>;
  /** Secondary binding for the same action, e.g. Ctrl+Shift+Z for redo. */
  aliasKeys?: ReadonlyArray<string>;
  aliasMacKeys?: ReadonlyArray<string>;
  /** Dotted key into the `help` i18n namespace. */
  labelKey: string;
  /** Handler this row documents, or `null` for a binding with no handler. */
  handlerKey: keyof KeyboardShortcutHandlers | null;
};

/** Display order. Every surface renders all of these, in this order. */
export const SHORTCUT_GROUPS = [
  "file",
  "selection",
  "edit",
  "steps",
  "help",
] as const satisfies ReadonlyArray<ShortcutGroup>;

/**
 * The single source of truth for every keyboard binding the SPA ships.
 * `shortcut-catalog.test.ts` pairs it to `KeyboardShortcutHandlers`, so a
 * handler can never ship undocumented and a row can never document a
 * handler that no longer exists.
 */
export const SHORTCUT_CATALOG: ReadonlyArray<ShortcutDef> = [
  ...GLOBAL_SHORTCUT_ROWS,
  ...EDIT_SHORTCUT_ROWS,
  ...STEP_SHORTCUT_ROWS,
];
