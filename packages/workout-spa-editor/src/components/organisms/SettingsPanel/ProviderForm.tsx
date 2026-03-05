import { useState } from "react";
import {
  PROVIDER_MODELS,
  getDefaultModel,
} from "../../../lib/provider-models";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import type { LlmProviderType } from "../../../store/ai-store";

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

  const modelOptions = PROVIDER_MODELS[type].map((m) => ({
    value: m.id,
    label: m.label,
  }));

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <Input
        label="Provider"
        variant="select"
        value={type}
        onChange={(e) =>
          handleTypeChange(e.target.value as LlmProviderType)
        }
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
      <div className="w-full">
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Model
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {modelOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
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
