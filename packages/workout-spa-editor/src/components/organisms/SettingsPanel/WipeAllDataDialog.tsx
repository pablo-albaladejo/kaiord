import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { WipeConfirmField } from "./WipeConfirmField";

export type WipeAllDataDialogProps = {
  open: boolean;
  /** A sync cycle in flight could write the old rows back after the wipe. */
  syncing: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

const CONTENT_CLASS =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-2xl border border-edge bg-surface p-6 shadow-lg";

const matches = (typed: string, word: string): boolean =>
  typed.trim().toLocaleUpperCase() === word.toLocaleUpperCase();

export const WipeAllDataDialog = ({
  open,
  syncing,
  onConfirm,
  onCancel,
}: WipeAllDataDialogProps) => {
  const t = useTranslate("settings");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const word = t("data.wipeDialog.confirmWord");
  const close = () => {
    setTyped("");
    onCancel();
  };
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className={CONTENT_CLASS} data-testid="wipe-dialog">
          <Dialog.Title className="text-lg font-semibold text-ink-strong">
            {t("data.wipeDialog.title")}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-ink-body">
            {t("data.wipeDialog.body")}
          </Dialog.Description>
          <p className="text-sm text-ink-body">{t("data.wipeDialog.drive")}</p>
          <WipeConfirmField word={word} value={typed} onChange={setTyped} />
          {syncing && (
            <p className="text-sm text-ink-muted">
              {t("data.wipeDialog.syncing")}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              {t("data.wipeDialog.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={!matches(typed, word) || syncing || busy}
              loading={busy}
              onClick={() => void confirm()}
              data-testid="wipe-confirm"
            >
              {t("data.wipeDialog.confirm")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
