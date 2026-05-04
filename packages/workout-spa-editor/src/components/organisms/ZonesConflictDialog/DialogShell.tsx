/**
 * `DialogShell` — modal backdrop, title, intro text, and Cancel/Apply
 * buttons. Extracted from `ZonesConflictDialog` to keep the parent
 * component under the React 60-line cap.
 */
import type { ReactNode } from "react";

export type DialogShellProps = {
  children: ReactNode;
  onCancel: () => void;
  onApply: () => void;
};

export const DialogShell = ({
  children,
  onCancel,
  onApply,
}: DialogShellProps) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="zones-conflict-title"
    data-testid="zones-conflict-dialog"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900">
      <h2 id="zones-conflict-title" className="text-base font-semibold">
        Resolve zones-sync conflicts
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Train2Go has different values for these fields. Pick which to keep —
        Kaiord (current) or Train2Go (incoming).
      </p>
      <ul className="mt-3 space-y-2">{children}</ul>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
);
