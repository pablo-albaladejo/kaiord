import {
  contextMenuPropsFrom,
  hasAnyContextMenuAction,
} from "../components/organisms/EditorContextMenu/context-menu-props-from-commands";
import { useEditorCommands } from "./use-editor-commands";

/**
 * Context-menu view of `useEditorCommands`. The menu is a projection of the
 * shared command list, never a second copy of the action set.
 */
export function useEditorContextMenu() {
  const { commands, ...selection } = useEditorCommands();
  const menu = contextMenuPropsFrom(commands);

  return {
    menu,
    hasAnyAction: hasAnyContextMenuAction(menu),
    ...selection,
  };
}
