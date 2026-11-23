import { AlertTriangle } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { StorageStatus } from "../../../store/storage-store";
import { useStorageStore } from "../../../store/storage-store";

type Props = {
  status?: StorageStatus;
};

export function StorageAvailabilityBanner({ status: injected }: Props = {}) {
  const t = useTranslate("common");
  const storeStatus = useStorageStore((s) => s.status);
  const status = injected ?? storeStatus;

  if (status !== "failed") return null;

  return (
    <div
      role="alert"
      data-testid="storage-unavailable-banner"
      className="flex items-center gap-3 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
    >
      <AlertTriangle
        aria-hidden="true"
        className="h-5 w-5 flex-shrink-0 text-danger-text"
      />
      <span>{t("storage.unavailable")}</span>
    </div>
  );
}
