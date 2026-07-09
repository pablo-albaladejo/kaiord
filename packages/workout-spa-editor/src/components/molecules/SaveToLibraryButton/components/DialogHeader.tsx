/**
 * DialogHeader Component
 *
 * Header section of the save to library dialog.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";

export function DialogHeader() {
  const t = useTranslate("library");
  const tCommon = useTranslate("common");
  return (
    <>
      <div className="flex items-center justify-between">
        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("saveDialog.title")}
        </Dialog.Title>
        <Dialog.Close asChild>
          <button
            className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
            aria-label={tCommon("actions.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>

      <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
        {t("saveDialog.description")}
      </Dialog.Description>
    </>
  );
}
