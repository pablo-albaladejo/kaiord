import { useState } from "react";
import { ModelSelect } from "./ModelSelect";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import type { LlmProviderConfig } from "../../../store/ai-store";

type ProviderEditRowProps = {
  provider: LlmProviderConfig;
  onSave: (id: string, updates: Partial<Omit<LlmProviderConfig, "id">>) => void;
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
      <ModelSelect type={provider.type} value={model} onChange={setModel} />
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
