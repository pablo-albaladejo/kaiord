import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { SETTINGS_SECTION_ATTR } from "../../pages/SettingsPage/settings-section";
import { ProviderForm } from "./ProviderForm";
import { ProviderList } from "./ProviderList";
import { useAiTabHandlers } from "./use-ai-tab-handlers";

export const AiTab: React.FC = () => {
  const providers = useAiProvidersLive() ?? [];
  const customPrompt = useAiCustomPromptLive() ?? "";
  const { onAdd, onRemove, onUpdate, onSetDefault, onPromptChange } =
    useAiTabHandlers();

  return (
    <div className="space-y-6">
      <section tabIndex={-1} {...{ [SETTINGS_SECTION_ATTR]: "providers" }}>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          LLM Providers
        </h3>
        <ProviderList
          providers={providers}
          onRemove={onRemove}
          onSetDefault={onSetDefault}
          onUpdate={onUpdate}
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Add Provider
        </h3>
        <ProviderForm onAdd={onAdd} />
      </section>

      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "custom-instructions" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Custom System Prompt
        </h3>
        <label
          htmlFor="ai-custom-system-prompt"
          className="mb-2 block text-sm text-gray-600 dark:text-gray-300"
        >
          Additional instructions applied to all generations
        </label>
        <textarea
          id="ai-custom-system-prompt"
          className="w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows={3}
          maxLength={500}
          placeholder="Additional instructions for all AI generations (e.g., 'I'm recovering from a knee injury')"
          value={customPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
      </section>
    </div>
  );
};
