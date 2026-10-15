import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { SETTINGS_SECTION_ATTR } from "../../pages/SettingsPage/settings-section";
import { AccountsSection } from "./AccountsSection";
import { AdvancedModels } from "./AdvancedModels";
import { AssistantCard } from "./AssistantCard";
import { CustomInstructions } from "./CustomInstructions";
import { UsageTab } from "./UsageTab";
import { useAiTabHandlers } from "./use-ai-tab-handlers";

export const AiTab: React.FC = () => {
  const providers = useAiProvidersLive({ includeKeyless: true }) ?? [];
  const customPrompt = useAiCustomPromptLive();
  const handlers = useAiTabHandlers();

  return (
    <div className="space-y-6">
      <section tabIndex={-1} {...{ [SETTINGS_SECTION_ATTR]: "assistant" }}>
        <AssistantCard />
      </section>

      <section tabIndex={-1} {...{ [SETTINGS_SECTION_ATTR]: "providers" }}>
        <AccountsSection providers={providers} handlers={handlers} />
      </section>

      <section tabIndex={-1} {...{ [SETTINGS_SECTION_ATTR]: "models" }}>
        <AdvancedModels />
      </section>

      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "custom-instructions" }}
      >
        <CustomInstructions
          value={customPrompt === undefined ? undefined : (customPrompt ?? "")}
          onSave={handlers.onPromptSave}
        />
      </section>

      <section tabIndex={-1} {...{ [SETTINGS_SECTION_ATTR]: "usage" }}>
        <UsageTab />
      </section>
    </div>
  );
};
