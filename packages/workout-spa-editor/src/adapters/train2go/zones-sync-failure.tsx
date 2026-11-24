import type { Locale } from "@kaiord/i18n";

import { ReloadAppButton } from "../../components/molecules/ReloadAppButton";
import type { useToast } from "../../hooks/use-toast";
import { loadConnectionNotices } from "../../i18n/connection-notices";
import type { Translate } from "../../i18n/use-translate";

/** Train2Go not answering, worded by its Connection's own notice. The shared
    notices load here, on the first failure, not with the app-wide provider
    that mounts the orchestrator; if they cannot load, the title says it. */
const notAnsweringNotice = async (
  locale: Locale
): Promise<string | undefined> => {
  const notices = await loadConnectionNotices().catch(() => null);
  return notices?.connectionNotice("not-answering", "Train2Go", locale)
    ?.message;
};

/** The toast a failed zones sync shows, by failure reason, in the athlete's
    language. Train2Go not answering is its Connection's own notice. A part
    of the App that did not load is the App's own failure: Train2Go was never
    asked, and a reload fetches that part again. */
export const handleFailure = async (
  reason: string,
  toasts: ReturnType<typeof useToast>,
  t: Translate,
  locale: Locale
): Promise<void> => {
  if (reason === "app-part-not-loaded") {
    toasts.error(t("zonesSync.notSynced"), t("zonesSync.notLoaded"), {
      action: <ReloadAppButton />,
    });
  } else if (reason === "transport-error") {
    toasts.error(t("zonesSync.notSynced"), await notAnsweringNotice(locale));
  } else if (reason === "shape-mismatch")
    toasts.warning(t("zonesSync.shapeMismatch"));
  else if (reason === "unsupported") toasts.info(t("zonesSync.unsupported"));
};
