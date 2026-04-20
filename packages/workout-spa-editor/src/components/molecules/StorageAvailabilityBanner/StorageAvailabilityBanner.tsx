import { AlertTriangle } from "lucide-react";

import type { StorageStatus } from "../../../store/storage-store";
import { useStorageStore } from "../../../store/storage-store";

type Props = {
  status?: StorageStatus;
};

const STORAGE_UNAVAILABLE_MESSAGE =
  "Storage unavailable — changes in this session won't be saved";

export function StorageAvailabilityBanner({ status: injected }: Props = {}) {
  const storeStatus = useStorageStore((s) => s.status);
  const status = injected ?? storeStatus;

  if (status !== "failed") return null;

  return (
    <div
      role="alert"
      data-testid="storage-unavailable-banner"
      className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      <AlertTriangle
        aria-hidden="true"
        className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
      />
      <span>{STORAGE_UNAVAILABLE_MESSAGE}</span>
    </div>
  );
}
