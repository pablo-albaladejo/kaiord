import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Pencil, Trash } from "lucide-react";
import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";

type ProviderRowMenuProps = {
  label: string;
  onRename: () => void;
  onRemove: () => void;
};

const ITEM =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-ink-body outline-none hover:bg-surface-elevated focus:bg-surface-elevated";
const DANGER =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-danger-text outline-none hover:bg-danger-bg focus:bg-danger-bg";

/** An account's less frequent actions; removing asks first, naming it. */
export function ProviderRowMenu({
  label,
  onRename,
  onRemove,
}: ProviderRowMenuProps) {
  const t = useTranslate("settings");
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={t("accounts.moreActions", { label })}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-body hover:bg-ink-strong/5"
          >
            <Icon icon={ICON_MAP.dots} size="md" color="inherit" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={5}
            className="z-50 min-w-[180px] rounded-lg border border-edge-soft bg-surface p-1 shadow-lg"
          >
            <DropdownMenu.Item className={ITEM} onSelect={onRename}>
              <Pencil className="h-4 w-4" />
              <span>{t("accounts.rename")}</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={DANGER}
              onSelect={() => setConfirming(true)}
            >
              <Trash className="h-4 w-4" />
              <span>{t("providers.remove")}</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <ConfirmationModal
        isOpen={confirming}
        title={t("providers.removeTitle", { label })}
        message={t("providers.removeMessage")}
        confirmLabel={t("providers.remove")}
        cancelLabel={t("providers.cancel")}
        variant="destructive"
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
