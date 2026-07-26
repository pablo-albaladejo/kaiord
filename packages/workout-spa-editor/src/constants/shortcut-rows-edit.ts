import type { ShortcutDef } from "./shortcut-catalog";

/** Edit-operation bindings — see `shortcut-catalog.ts`. */
export const EDIT_SHORTCUT_ROWS: ReadonlyArray<ShortcutDef> = [
  {
    id: "undo",
    group: "edit",
    keys: ["Ctrl", "Z"],
    macKeys: ["⌘", "Z"],
    labelKey: "shortcuts.edit.undo",
    handlerKey: "onUndo",
  },
  {
    id: "redo",
    group: "edit",
    keys: ["Ctrl", "Y"],
    macKeys: ["⌘", "Y"],
    aliasKeys: ["Ctrl", "Shift", "Z"],
    aliasMacKeys: ["⌘", "⇧", "Z"],
    labelKey: "shortcuts.edit.redo",
    handlerKey: "onRedo",
  },
  {
    id: "copy",
    group: "edit",
    keys: ["Ctrl", "C"],
    macKeys: ["⌘", "C"],
    labelKey: "shortcuts.edit.copy",
    handlerKey: "onCopy",
  },
  {
    id: "cut",
    group: "edit",
    keys: ["Ctrl", "X"],
    macKeys: ["⌘", "X"],
    labelKey: "shortcuts.edit.cut",
    handlerKey: "onCut",
  },
  {
    id: "paste",
    group: "edit",
    keys: ["Ctrl", "V"],
    macKeys: ["⌘", "V"],
    labelKey: "shortcuts.edit.paste",
    handlerKey: "onPaste",
  },
  {
    id: "delete",
    group: "edit",
    keys: ["Del"],
    macKeys: ["⌫"],
    aliasKeys: ["Backspace"],
    labelKey: "shortcuts.edit.delete",
    handlerKey: "onDelete",
  },
];
