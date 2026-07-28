import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export type EditorCommandGroup = "do" | "learn";

/** One enumerable editor action, rendered by the palette and the context menu. */
export type EditorCommand = {
  id: string;
  group: EditorCommandGroup;
  /** Dotted key into the `palette` i18n namespace. */
  titleKey: string;
  titleParams?: Record<string, string | number>;
  subtitleKey?: string;
  /** `SHORTCUT_CATALOG` row id whose chips document this command. */
  shortcutId?: string;
  enabled: boolean;
  run: () => void;
};

/**
 * Live availability, one field per command. Each mirrors the guard its own
 * handler thunk applies, so a row is never offered for an action that would
 * no-op — sharing a coarser flag across two commands is what let the
 * right-click menu offer Delete on a repetition block.
 */
export type EditorCommandGuards = {
  canCut: boolean;
  canCopy: boolean;
  canPaste: boolean;
  canDelete: boolean;
  canSelectAll: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canSave: boolean;
  selectedCount: number;
};

export type EditorCommandInput = {
  handlers: KeyboardShortcutHandlers;
  guards: EditorCommandGuards;
};
