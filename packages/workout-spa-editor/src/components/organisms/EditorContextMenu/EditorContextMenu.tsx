import * as ContextMenu from "@radix-ui/react-context-menu";
import type { ReactNode } from "react";
import { useRef } from "react";

import { useEditorContextMenu } from "../../../hooks/use-editor-context-menu";
import { EditorContextMenuContent } from "./EditorContextMenuContent";

type EditorContextMenuProps = {
  readonly children: ReactNode;
};

export const EditorContextMenu = ({ children }: EditorContextMenuProps) => {
  const ctx = useEditorContextMenu();
  const targetStepId = useRef<string | null>(null);

  if (!ctx.hasAnyAction) {
    return <>{children}</>;
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest("[data-step-id]");
    targetStepId.current = el?.getAttribute("data-step-id") ?? null;
  };

  const handleOpen = (open: boolean) => {
    if (!open) return;
    const stepId = targetStepId.current;
    if (!stepId) {
      ctx.clearStepSelection();
      return;
    }
    const isInSelection =
      ctx.selectedStepId === stepId || ctx.selectedStepIds.includes(stepId);
    if (!isInSelection) {
      ctx.selectStep(stepId);
    }
  };

  return (
    <ContextMenu.Root onOpenChange={handleOpen}>
      <ContextMenu.Trigger
        asChild
        aria-label="Workout editor actions"
        onContextMenu={handleContextMenu}
      >
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <EditorContextMenuContent
          showCut={ctx.showCut}
          showCopy={ctx.showCopy}
          showPaste={ctx.showPaste}
          showDelete={ctx.showDelete}
          showSelectAll={ctx.showSelectAll}
          showGroup={ctx.showGroup}
          showUngroup={ctx.showUngroup}
          onCut={() => ctx.handlers.onCut?.()}
          onCopy={() => ctx.handlers.onCopy?.()}
          onPaste={() => ctx.handlers.onPaste?.()}
          onDelete={() => ctx.handlers.onDelete?.()}
          onSelectAll={() => ctx.handlers.onSelectAll?.()}
          onGroup={() => ctx.handlers.onCreateBlock?.()}
          onUngroup={() => ctx.handlers.onUngroupBlock?.()}
        />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
