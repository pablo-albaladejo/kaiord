import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderType } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";

type ProviderFormProps = {
  onAdd: (config: {
    type: LlmProviderType;
    apiKey: string;
    label: string;
  }) => void;
};

export const ProviderForm: React.FC<ProviderFormProps> = ({ onAdd }) => {
  const t = useTranslate("settings");
  const [type, setType] = useState<LlmProviderType>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = () => {
    if (!apiKey || !label) return;
    onAdd({ type, apiKey, label });
    setApiKey("");
    setLabel("");
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <Input
        label={t("providers.provider")}
        variant="select"
        value={type}
        onChange={(e) => setType(e.target.value as LlmProviderType)}
        options={[
          { value: "anthropic", label: "Anthropic (Claude)" },
          { value: "openai", label: "OpenAI (GPT)" },
          { value: "google", label: "Google (Gemini)" },
        ]}
      />
      <Input
        label={t("providers.label")}
        placeholder={t("providers.labelPlaceholder")}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <Input
        label={t("providers.apiKey")}
        type="password"
        placeholder="sk-..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <Button size="sm" onClick={handleSubmit} disabled={!apiKey || !label}>
        {t("providers.addProvider")}
      </Button>
    </div>
  );
};
