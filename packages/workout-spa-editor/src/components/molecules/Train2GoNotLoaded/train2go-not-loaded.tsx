/**
 * A Train2Go action that failed because part of the App did not load: the
 * App's own failure, so Train2Go was never asked, and a reload fetches that
 * part again. The one place that maps a failure reason to that sentence (the
 * `coaching` dictionary's `appPartNotLoaded`) and pairs it with Reload, for
 * the session dialog's inline notice and for the toasts of week sync,
 * connect and zones sync.
 */
import type { useToast } from "../../../hooks/use-toast";
import type { Translate } from "../../../i18n/use-translate";
import { isAppPartNotLoadedReason } from "../../../types/app-part-not-loaded-error";
import { ReloadAppButton } from "../ReloadAppButton";

/** The sentence for a reason that is the App's own failure, else null. */
export const train2GoNotLoadedMessage = (
  reason: string,
  t: Translate
): string | null =>
  isAppPartNotLoadedReason(reason) ? t("appPartNotLoaded") : null;

export const Train2GoNotLoadedNotice = ({
  message,
  testId,
}: {
  message: string;
  testId: string;
}) => (
  <div data-testid={testId} className="space-y-1 text-xs">
    <p className="text-danger-text" role="status">
      {message}
    </p>
    <ReloadAppButton />
  </div>
);

/** The not-loaded toast with Reload; `title` names what was not done. */
export const toastTrain2GoNotLoaded = (
  toasts: Pick<ReturnType<typeof useToast>, "error">,
  t: Translate,
  title?: string
): void => {
  const message = t("appPartNotLoaded");
  const action = <ReloadAppButton />;
  if (title) toasts.error(title, message, { action });
  else toasts.error(message, undefined, { action });
};
