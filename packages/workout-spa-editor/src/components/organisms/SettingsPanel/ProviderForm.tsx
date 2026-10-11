import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderType } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { KeyCheckMessage, type KeyCheckStatus } from "./KeyCheckMessage";
import type { KeySaveOutcome } from "./save-with-key-check";

type ProviderFormProps = {
  onAdd: (config: {
    type: LlmProviderType;
    apiKey: string;
    label: string;
  }) => Promise<KeySaveOutcome>;
};

export const ProviderForm: React.FC<ProviderFormProps> = ({ onAdd }) => {
  const t = useTranslate("settings");
  const [type, setType] = useState<LlmProviderType>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<KeyCheckStatus>("idle");
  const checking = status === "checking";

  const handleSubmit = async () => {
    if (!apiKey || !label) return;
    setStatus("checking");
    const outcome = await onAdd({ type, apiKey, label });
    setStatus(outcome);
    if (outcome === "invalid" || outcome === "failed") return;
    setApiKey("");
    setLabel("");
  };

  return (
    <div className="space-y-3 rounded-lg border border-edge p-4">
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
      <Button
        size="sm"
        onClick={() => void handleSubmit()}
        disabled={checking || !apiKey || !label}
      >
        {t("providers.addProvider")}
      </Button>
      <KeyCheckMessage status={status} />
    </div>
  );
};
