import type { ReactNode } from "react";

import { useTranslate } from "../../../i18n/use-translate";

export type DialogShellProps = {
  children: ReactNode;
  onCancel: () => void;
  onApply: () => void;
};

export const DialogShell = ({
  children,
  onCancel,
  onApply,
}: DialogShellProps) => {
  const t = useTranslate("zones");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="zones-conflict-title"
      data-testid="zones-conflict-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900">
        <h2 id="zones-conflict-title" className="text-base font-semibold">
          {t("conflict.title")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("conflict.intro")}
        </p>
        <ul className="mt-3 space-y-2">{children}</ul>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-edge px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t("conflict.cancel")}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-md bg-danger px-3 py-1 text-sm text-white hover:bg-danger"
          >
            {t("conflict.apply")}
          </button>
        </div>
      </div>
    </div>
  );
};
