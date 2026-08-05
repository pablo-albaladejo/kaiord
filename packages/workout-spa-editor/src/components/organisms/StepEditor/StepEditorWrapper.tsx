import type { ReactNode } from "react";

type StepEditorWrapperProps = {
  className: string;
  children: ReactNode;
};

export function StepEditorWrapper({
  className,
  children,
}: StepEditorWrapperProps) {
  // The form opens inside the list, under the row it edits, so it reads as
  // that row unfolding rather than as another card on the pile.
  return (
    <div
      className={`rounded-xl border border-edge-soft bg-surface-elevated px-4 py-4 sm:px-5 ${className}`}
      data-testid="step-editor-panel"
    >
      {children}
    </div>
  );
}
