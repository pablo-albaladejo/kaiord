import { clearAllProviders } from "../../../application/ai/clear-all-providers";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { SETTINGS_SECTION_ATTR } from "../../pages/SettingsPage/settings-section";
import { PrivacyInformationSection } from "./PrivacyInformationSection";

const SECURE_STORAGE_PREFIX = "kaiord_secure_";
const CLEAR_FAILED_TOAST = "Failed to clear API keys — please retry.";

const clearSecureStorage = (): void => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(SECURE_STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
};

export const PrivacyTab: React.FC = () => {
  const t = useTranslate("settings");
  const persistence = usePersistence();
  const toast = useToastContext();

  const handleClearAll = async () => {
    try {
      await clearAllProviders(persistence);
      clearSecureStorage();
    } catch {
      toast.error(CLEAR_FAILED_TOAST);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyInformationSection />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("privacy.analytics")}
        </h3>
        <p className="text-sm text-ink-body">
          {t("privacy.analyticsIntro")}{" "}
          <a
            href="https://umami.is/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink-body"
          >
            {t("privacy.analyticsLink")}
          </a>{" "}
          {t("privacy.analyticsOutro")}
        </p>
      </section>

      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "data-management" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("privacy.dataManagement")}
        </h3>
        <Button variant="danger" size="sm" onClick={handleClearAll}>
          {t("privacy.clearAllApiKeys")}
        </Button>
        <p className="mt-2 text-xs text-ink-muted">
          {t("privacy.clearAllHint")}
        </p>
      </section>
    </div>
  );
};
