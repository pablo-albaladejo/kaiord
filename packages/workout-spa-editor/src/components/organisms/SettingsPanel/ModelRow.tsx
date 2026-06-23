import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { ModelPicker } from "./ModelPicker";

type ModelRowProps = {
  rowLabel: string;
  providers: LlmProviderConfig[];
  providerId: string;
  modelId: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  onReset?: () => void;
};

export const ModelRow: React.FC<ModelRowProps> = ({
  rowLabel,
  providers,
  providerId,
  modelId,
  onProviderChange,
  onModelChange,
  onReset,
}) => {
  const selectedProvider =
    providers.find((p) => p.id === providerId) ?? providers[0];

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {rowLabel}
      </p>
      <Input
        label="Provider"
        variant="select"
        value={selectedProvider?.id ?? ""}
        onChange={(e) => onProviderChange(e.target.value)}
        options={providers.map((p) => ({ value: p.id, label: p.label }))}
      />
      {selectedProvider && (
        <ModelPicker
          type={selectedProvider.type}
          value={modelId}
          onChange={onModelChange}
        />
      )}
      {onReset && (
        <Button size="sm" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
};
