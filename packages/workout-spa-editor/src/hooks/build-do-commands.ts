import type { EditorCommand, EditorCommandInput } from "./editor-command.types";

/**
 * Command ids are also `SHORTCUT_CATALOG` row ids, so the key chips resolve
 * without a second mapping. `subtitleKey` flips to `.requires` when the guard
 * is closed, which is how a disabled row explains itself.
 */
const doCommand = (
  id: string,
  enabled: boolean,
  run: () => void
): EditorCommand => ({
  id,
  group: "do",
  titleKey: `commands.${id}.title`,
  subtitleKey: `commands.${id}.${enabled ? "subtitle" : "requires"}`,
  shortcutId: id,
  enabled,
  run,
});

export const buildDoCommands = ({
  handlers: h,
  guards: g,
}: EditorCommandInput): ReadonlyArray<EditorCommand> => [
  doCommand("cut", g.canCut, () => void h.onCut?.()),
  doCommand("copy", g.canCopy, () => void h.onCopy?.()),
  doCommand("paste", g.canPaste, () => void h.onPaste?.()),
  doCommand("delete", g.canDelete, () => void h.onDelete?.()),
  doCommand("select-all", g.canSelectAll, () => void h.onSelectAll?.()),
  {
    ...doCommand("create-block", g.canGroup, () => void h.onCreateBlock?.()),
    // The count-free title avoids "the 1 selected steps" while the guard is
    // closed; `⌘G` opens the block dialog, so the subtitle never claims a run.
    titleKey: g.canGroup
      ? "commands.create-block.titleCount"
      : "commands.create-block.title",
    titleParams: { count: g.selectedCount },
  },
  doCommand("ungroup-block", g.canUngroup, () => void h.onUngroupBlock?.()),
  doCommand("undo", g.canUndo, () => void h.onUndo?.()),
  doCommand("redo", g.canRedo, () => void h.onRedo?.()),
  doCommand("save", g.canSave, () => void h.onSave?.()),
];
