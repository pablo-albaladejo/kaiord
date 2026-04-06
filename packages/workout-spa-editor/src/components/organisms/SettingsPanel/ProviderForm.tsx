import { useState } from "react";

import { getDefaultModel } from "../../../lib/provider-models";
import type { LlmProviderType } from "../../../store/ai-store";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { ModelSelect } from "./ModelSelect";

type ProviderFormProps = {
  onAdd: (config: {
    type: LlmProviderType;
    apiKey: string;
    model: string;
    label: string;
  }) => void;
};

export const ProviderForm: React.FC<ProviderFormProps> = ({ onAdd }) => {
  const [type, setType] = useState<LlmProviderType>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(getDefaultModel("anthropic"));
  const [label, setLabel] = useState("");

  const handleTypeChange = (newType: LlmProviderType) => {
    setType(newType);
    setModel(getDefaultModel(newType));
  };

  const handleSubmit = () => {
    if (!apiKey || !model || !label) return;
    onAdd({ type, apiKey, model, label });
    setApiKey("");
    setLabel("");
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <Input
        label="Provider"
        variant="select"
        value={type}
        onChange={(e) => handleTypeChange(e.target.value as LlmProviderType)}
        options={[
          { value: "anthropic", label: "Anthropic (Claude)" },
          { value: "openai", label: "OpenAI (GPT)" },
          { value: "google", label: "Google (Gemini)" },
        ]}
      />
      <Input
        label="Label"
        placeholder="e.g., My Claude"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <Input
        label="API Key"
        type="password"
        placeholder="sk-..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <ModelSelect type={type} value={model} onChange={setModel} />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!apiKey || !model || !label}
      >
        Add Provider
      </Button>
    </div>
  );
};
