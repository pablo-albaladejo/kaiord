import * as ContextMenu from "@radix-ui/react-context-menu";

import type { ContextMenuContentProps } from "./context-menu-content.types";
import { menuContentClass } from "./context-menu-styles";
import { EditActions } from "./EditActions";
import { StructuralActions } from "./StructuralActions";

export const EditorContextMenuContent = (p: ContextMenuContentProps) => {
  const hasEdit = p.showCut || p.showCopy || p.showPaste || p.showDelete;
  const hasStructural = p.showSelectAll || p.showGroup || p.showUngroup;

  return (
    <ContextMenu.Content
      className={menuContentClass}
      data-testid="editor-context-menu"
    >
      <EditActions {...p} />
      {hasEdit && hasStructural && (
        <ContextMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      )}
      <StructuralActions {...p} />
    </ContextMenu.Content>
  );
};
