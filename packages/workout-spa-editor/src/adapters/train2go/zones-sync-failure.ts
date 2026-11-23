import { connectionNotice, type Locale } from "@kaiord/i18n";

import type { useToast } from "../../hooks/use-toast";
import type { Translate } from "../../i18n/use-translate";

/** The toast a failed zones sync shows, by failure reason, in the athlete's
    language. Train2Go not answering is its Connection's own notice. */
export const handleFailure = (
  reason: string,
  toasts: ReturnType<typeof useToast>,
  t: Translate,
  locale: Locale
): void => {
  if (reason === "transport-error") {
    toasts.error(
      t("zonesSync.notSynced"),
      connectionNotice("not-answering", "Train2Go", locale)?.message
    );
  } else if (reason === "shape-mismatch")
    toasts.warning(t("zonesSync.shapeMismatch"));
  else if (reason === "unsupported") toasts.info(t("zonesSync.unsupported"));
};
