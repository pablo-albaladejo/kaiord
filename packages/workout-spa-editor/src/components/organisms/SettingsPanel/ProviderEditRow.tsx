import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import {
  PROVIDER_MODELS,
} from "../../../lib/provider-models";
import type { LlmProviderConfig } from "../../../store/ai-store";

type ProviderEditRowProps = {
  provider: LlmProviderConfig;
  onSave: (
    id: string,
    updates: Partial<Omit<LlmProviderConfig, "id">>
  ) => void;
  onCancel: () => void;
};

export const ProviderEditRow: React.FC<ProviderEditRowProps> = ({
  provider,
  onSave,
  onCancel,
}) => {
  const [label, setLabel] = useState(provider.label);
  const [apiKey, setApiKey] = useState(provider.apiKey);
  const [model, setModel] = useState(provider.model);

  const models = PROVIDER_MODELS[provider.type].map((m) => ({
    value: m.id,
    label: m.label,
  }));

  return (
    <div className="space-y-2 rounded-lg border border-blue-200 p-3 dark:border-blue-700">
      <Input
        label="Label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <Input
        label="API Key"
        type="password"
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
          {models.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(provider.id, { label, apiKey, model })}
          disabled={!label || !apiKey}
        >
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
