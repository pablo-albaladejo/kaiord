/**
 * ShortcutSheet Component
 *
 * The `?` sheet: every catalog shortcut, grouped, over the app.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { SHORTCUT_GROUPS } from "../../../constants/shortcut-catalog";
import { useTranslate } from "../../../i18n/use-translate";
import { isMacPlatform } from "../../../utils/platform";
import { ShortcutSheetGroup } from "./ShortcutSheetGroup";

export type ShortcutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutSheet({ open, onOpenChange }: ShortcutSheetProps) {
  const t = useTranslate("help");
  const tCommon = useTranslate("common");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          data-testid="shortcut-sheet"
          className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-edge bg-surface shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-2xl"
        >
          <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
            <Dialog.Title className="flex-1 text-base font-semibold text-ink-strong">
              {t("shortcuts.heading")}
            </Dialog.Title>
            <span className="text-xs text-ink-muted">
              {isMacPlatform() ? "macOS" : "Windows / Linux"}
            </span>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={tCommon("actions.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {SHORTCUT_GROUPS.map((group) => (
              <ShortcutSheetGroup key={group} group={group} />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
