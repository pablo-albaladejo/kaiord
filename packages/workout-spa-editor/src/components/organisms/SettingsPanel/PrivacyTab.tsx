import { createSecureStorage } from "../../../lib/secure-storage";
import { useAiStore } from "../../../store/ai-store";
import { useGarminStore } from "../../../store/garmin-store";
import { Button } from "../../atoms/Button";

export const PrivacyTab: React.FC = () => {
  const clearAi = () => useAiStore.setState({ providers: [] });
  const clearGarmin = useGarminStore.getState().clearCredentials;

  const handleClearAll = () => {
    clearAi();
    clearGarmin();
    createSecureStorage("").clearAll();
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
            Garmin credentials are sent to the Lambda proxy only for the
            duration of the push request.
          </li>
          <li>
            LLM API keys are sent directly to the provider (Anthropic, OpenAI,
            or Google) — they never pass through our infrastructure.
          </li>
          <li>
            You can self-host the Lambda —{" "}
            <a
              href="https://github.com/pablo-albaladejo/kaiord/tree/main/packages/infra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              see documentation
            </a>
            .
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
          Clear All Credentials
        </Button>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          This removes all stored API keys and Garmin credentials from your
          browser.
        </p>
      </section>
    </div>
  );
};
