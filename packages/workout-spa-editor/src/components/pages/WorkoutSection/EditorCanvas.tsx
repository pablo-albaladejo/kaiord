import type { ReactNode } from "react";

/**
 * The editor's single surface. It replaces five sibling cards of identical
 * chrome — header, stats, chart, step form, list — that gave equal weight to
 * a summary and to the thing being edited. One border, one radius, one
 * scroll: the chart indexes the rows beneath it instead of floating above
 * them.
 */
export function EditorCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-edge-soft bg-surface"
      data-testid="editor-canvas"
    >
      {children}
    </div>
  );
}
