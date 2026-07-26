import type { ShortcutDef } from "./shortcut-catalog";

/** File, selection and help bindings — see `shortcut-catalog.ts`. */
export const GLOBAL_SHORTCUT_ROWS: ReadonlyArray<ShortcutDef> = [
  {
    id: "save",
    group: "file",
    keys: ["Ctrl", "S"],
    macKeys: ["⌘", "S"],
    labelKey: "shortcuts.file.save",
    handlerKey: "onSave",
  },
  {
    id: "select-all",
    group: "selection",
    keys: ["Ctrl", "A"],
    macKeys: ["⌘", "A"],
    labelKey: "shortcuts.selection.selectAll",
    handlerKey: "onSelectAll",
  },
  {
    id: "clear-selection",
    group: "selection",
    keys: ["Esc"],
    labelKey: "shortcuts.selection.clear",
    handlerKey: "onClearSelection",
  },
  {
    id: "show-shortcuts",
    group: "help",
    keys: ["?"],
    labelKey: "shortcuts.help.showShortcuts",
    handlerKey: "onShowShortcuts",
  },
];
