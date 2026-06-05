import { clearAllProviders } from "../../../application/ai/clear-all-providers";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
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
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Analytics
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This editor uses{" "}
          <a
            href="https://www.cloudflare.com/web-analytics/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cloudflare Web Analytics
          </a>{" "}
          to track aggregate usage (page views, workout generation, exports). No
          cookies are set and no personal data is collected.
        </p>
      </section>

      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "data-management" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Data Management
        </h3>
        <Button variant="danger" size="sm" onClick={handleClearAll}>
          Clear All API Keys
        </Button>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          This removes all stored API keys from your browser.
        </p>
      </section>
    </div>
  );
};
