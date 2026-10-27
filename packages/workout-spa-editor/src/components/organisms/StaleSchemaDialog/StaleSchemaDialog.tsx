import * as Dialog from "@radix-ui/react-dialog";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type StaleSchemaDialogProps = {
  /** An in-memory workout exists; the database is closed, so offer a file. */
  hasDraft: boolean;
  /** No newer worker was found yet, or the update check failed: Retry. */
  tryAgainLater: boolean;
  reloading: boolean;
  onDownloadDraft: () => void;
  onReload: () => void;
};

const CONTENT_CLASS =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-2xl border border-edge bg-surface p-6 shadow-lg";

const keepOpen = (event: Event) => event.preventDefault();

/** Cannot be dismissed: this tab must not touch the newer database. */
export const StaleSchemaDialog = ({
  hasDraft,
  tryAgainLater,
  reloading,
  onDownloadDraft,
  onReload,
}: StaleSchemaDialogProps) => {
  const t = useTranslate("common");

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={CONTENT_CLASS}
          data-testid="stale-schema-dialog"
          onEscapeKeyDown={keepOpen}
          onPointerDownOutside={keepOpen}
          onInteractOutside={keepOpen}
        >
          <Dialog.Title className="text-lg font-semibold text-ink-strong">
            {t("staleSchema.title")}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-ink-body">
            {t("staleSchema.body")}
          </Dialog.Description>
          <p className="text-sm text-ink-body">{t("staleSchema.dataSafe")}</p>
          {tryAgainLater && (
            <p className="text-sm text-ink-muted" data-testid="stale-try-later">
              {t("staleSchema.tryAgainLater")}
            </p>
          )}
          <div className="flex justify-end gap-2">
            {hasDraft && (
              <Button variant="secondary" onClick={onDownloadDraft}>
                {t("staleSchema.downloadDraft")}
              </Button>
            )}
            <Button loading={reloading} disabled={reloading} onClick={onReload}>
              {t(tryAgainLater ? "staleSchema.retry" : "staleSchema.reload")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
