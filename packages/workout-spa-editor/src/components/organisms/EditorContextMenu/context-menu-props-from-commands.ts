import type { EditorCommand } from "../../../hooks/editor-command.types";
import type { ContextMenuContentProps } from "./context-menu-content.types";

/**
 * Projection of the shared command list onto the right-click menu. The menu
 * renders a subset of the `do` group; it owns no action list of its own.
 */
export const contextMenuPropsFrom = (
  commands: ReadonlyArray<EditorCommand>
): ContextMenuContentProps => {
  const at = (id: string): EditorCommand | undefined =>
    commands.find((command) => command.id === id);
  const show = (id: string): boolean => at(id)?.enabled ?? false;
  const on =
    (id: string): (() => void) =>
    () =>
      at(id)?.run();

  return {
    showCut: show("cut"),
    showCopy: show("copy"),
    showPaste: show("paste"),
    showDelete: show("delete"),
    showSelectAll: show("select-all"),
    showGroup: show("create-block"),
    showUngroup: show("ungroup-block"),
    onCut: on("cut"),
    onCopy: on("copy"),
    onPaste: on("paste"),
    onDelete: on("delete"),
    onSelectAll: on("select-all"),
    onGroup: on("create-block"),
    onUngroup: on("ungroup-block"),
  };
};

/** The menu suppresses itself entirely when it would render no item. */
export const hasAnyContextMenuAction = (p: ContextMenuContentProps): boolean =>
  p.showCut ||
  p.showCopy ||
  p.showPaste ||
  p.showDelete ||
  p.showSelectAll ||
  p.showGroup ||
  p.showUngroup;
