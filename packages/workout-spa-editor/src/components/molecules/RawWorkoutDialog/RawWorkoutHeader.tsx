/**
 * RawWorkoutHeader - Title bar with close button for raw workout dialog.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";

export type RawWorkoutHeaderProps = {
  title: string;
};

export function RawWorkoutHeader({ title }: RawWorkoutHeaderProps) {
  const tc = useTranslate("common");
  return (
    <div className="flex items-center justify-between">
      <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
      <Dialog.Close asChild>
        <button
          type="button"
          aria-label={tc("actions.close")}
          className="rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </Dialog.Close>
    </div>
  );
}
