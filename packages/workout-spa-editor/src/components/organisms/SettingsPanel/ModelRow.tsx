import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("settings");
  const selectedProvider =
    providers.find((p) => p.id === providerId) ?? providers[0];

  return (
    <div className="space-y-2 rounded-lg border border-edge p-3">
      <p className="text-sm font-medium text-ink-body">{rowLabel}</p>
      <Input
        label={t("providers.provider")}
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
          {t("models.reset")}
        </Button>
      )}
    </div>
  );
};
