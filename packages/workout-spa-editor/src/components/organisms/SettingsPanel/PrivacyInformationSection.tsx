export function PrivacyInformationSection() {
  return (
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
          Train2Go import uses a browser extension that reads the coaching plan
          displayed on Train2Go pages you are already viewing. It does not read
          your password or authentication tokens.
        </li>
        <li>
          LLM API keys are sent directly to the provider (Anthropic, OpenAI, or
          Google) — Kaiord does not receive or relay this data.
        </li>
        <li>We are not responsible for credential security on your device.</li>
      </ul>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <a
          href="https://kaiord.com/docs/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Read the full privacy policy
        </a>
      </p>
    </section>
  );
}
