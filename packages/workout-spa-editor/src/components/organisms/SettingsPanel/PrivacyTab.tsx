import { useAiStore } from "../../../store/ai-store";
import { Button } from "../../atoms/Button";

const SECURE_STORAGE_PREFIX = "kaiord_secure_";

const clearSecureStorage = (): void => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(SECURE_STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
};

export const PrivacyTab: React.FC = () => {
  const clearAi = () => useAiStore.setState({ providers: [] });

  const handleClearAll = () => {
    clearAi();
    clearSecureStorage();
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Privacy Information
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>We do not store your credentials on any server.</li>
          <li>
            Garmin integration uses a browser extension that piggybacks on your
            existing Garmin Connect session. No credentials leave your browser.
          </li>
          <li>
            LLM API keys are sent directly to the provider (Anthropic, OpenAI,
            or Google) — they never pass through our infrastructure.
          </li>
          <li>
            We are not responsible for credential security on your device.
          </li>
        </ul>
      </section>

      <section>
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
