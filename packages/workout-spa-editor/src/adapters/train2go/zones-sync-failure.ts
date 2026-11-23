import type { useToast } from "../../hooks/use-toast";
import type { Translate } from "../../i18n/use-translate";

/** The toast a failed zones sync shows, by failure reason, in the athlete's language. */
export const handleFailure = (
  reason: string,
  toasts: ReturnType<typeof useToast>,
  t: Translate
): void => {
  if (reason === "transport-error") toasts.error(t("zonesSync.fetchFailed"));
  else if (reason === "shape-mismatch")
    toasts.warning(t("zonesSync.shapeMismatch"));
  else if (reason === "unsupported") toasts.info(t("zonesSync.unsupported"));
};
