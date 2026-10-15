import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRef, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { RowMenuContent } from "./ProviderRowMenuContent";

type ProviderRowMenuProps = {
  label: string;
  onRename: () => void;
  onRemove: () => void;
  /** Where the focus goes once a removal is confirmed: this row is going away. */
  onRemoved?: () => void;
};

/** An account's less frequent actions; removing asks first, naming it. */
export function ProviderRowMenu({
  label,
  onRename,
  onRemove,
  onRemoved,
}: ProviderRowMenuProps) {
  const t = useTranslate("settings");
  const [confirming, setConfirming] = useState(false);
  const removed = useRef(false);
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
          <RowMenuContent
            onRename={onRename}
            onRemove={() => setConfirming(true)}
          />
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
          removed.current = true;
          setConfirming(false);
          onRemove();
        }}
        onCloseAutoFocus={(event) => {
          if (!removed.current || !onRemoved) return;
          event.preventDefault();
          onRemoved();
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
