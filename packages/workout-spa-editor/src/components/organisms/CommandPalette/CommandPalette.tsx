/**
 * CommandPalette Component
 *
 * The ⌘K palette: one searchable list that both runs editor commands and
 * links out to the docs, over the app rather than in place of it.
 */

import * as Dialog from "@radix-ui/react-dialog";

import { useTranslate } from "../../../i18n/use-translate";
import { CommandPaletteBody } from "./CommandPaletteBody";
import { CONTENT_CLASS, OVERLAY_CLASS } from "./palette-styles";

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
}: CommandPaletteProps) {
  const t = useTranslate("palette");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLASS} />
        <Dialog.Content
          aria-describedby={undefined}
          data-testid="command-palette"
          className={CONTENT_CLASS}
        >
          <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
          <CommandPaletteBody
            onClose={() => onOpenChange(false)}
            onShowShortcuts={onShowShortcuts}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
