import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useTranslate } from "../../../i18n/use-translate";
import { SETTINGS_SECTION_ATTR } from "../../pages/SettingsPage/settings-section";
import { ModelsSection } from "./ModelsSection";
import { ProviderForm } from "./ProviderForm";
import { ProviderList } from "./ProviderList";
import { useAiTabHandlers } from "./use-ai-tab-handlers";

export const AiTab: React.FC = () => {
  const t = useTranslate("settings");
  const providers = useAiProvidersLive() ?? [];
  const customPrompt = useAiCustomPromptLive() ?? "";
  const { onAdd, onRemove, onUpdate, onSetDefault, onPromptChange } =
    useAiTabHandlers();

  return (
    <div className="space-y-6">
      <section tabIndex={-1} {...{ [SETTINGS_SECTION_ATTR]: "providers" }}>
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("ai.llmProviders")}
        </h3>
        <ProviderList
          providers={providers}
          onRemove={onRemove}
          onSetDefault={onSetDefault}
          onUpdate={onUpdate}
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("ai.addProvider")}
        </h3>
        <ProviderForm onAdd={onAdd} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("ai.models")}
        </h3>
        <ModelsSection />
      </section>

      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "custom-instructions" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("ai.customSystemPrompt")}
        </h3>
        <label
          htmlFor="ai-custom-system-prompt"
          className="mb-2 block text-sm text-ink-body"
        >
          {t("ai.customInstructionsLabel")}
        </label>
        <textarea
          id="ai-custom-system-prompt"
          className="w-full rounded-lg border border-edge bg-surface p-3 text-sm text-ink-strong"
          rows={3}
          maxLength={500}
          placeholder={t("ai.customInstructionsPlaceholder")}
          value={customPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
      </section>
    </div>
  );
};
