import type { ShortcutDef } from "./shortcut-catalog";

/** Step-management bindings — see `shortcut-catalog.ts`. */
export const STEP_SHORTCUT_ROWS: ReadonlyArray<ShortcutDef> = [
  {
    id: "move-up",
    group: "steps",
    keys: ["Alt", "↑"],
    macKeys: ["⌥", "↑"],
    labelKey: "shortcuts.steps.moveUp",
    handlerKey: "onMoveStepUp",
  },
  {
    id: "move-down",
    group: "steps",
    keys: ["Alt", "↓"],
    macKeys: ["⌥", "↓"],
    labelKey: "shortcuts.steps.moveDown",
    handlerKey: "onMoveStepDown",
  },
  {
    id: "create-block",
    group: "steps",
    keys: ["Ctrl", "G"],
    macKeys: ["⌘", "G"],
    labelKey: "shortcuts.steps.createBlock",
    handlerKey: "onCreateBlock",
  },
  {
    id: "ungroup-block",
    group: "steps",
    keys: ["Ctrl", "Shift", "G"],
    macKeys: ["⌘", "⇧", "G"],
    labelKey: "shortcuts.steps.ungroup",
    handlerKey: "onUngroupBlock",
  },
];
