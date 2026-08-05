import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

type ProviderRowProps = {
  provider: LlmProviderConfig;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
};

export const ProviderRow: React.FC<ProviderRowProps> = ({
  provider: p,
  onEdit,
  onRemove,
  onSetDefault,
}) => {
  const t = useTranslate("settings");
  return (
    <div className="flex items-center justify-between rounded-lg border border-edge p-3">
      <div>
        <span className="font-medium">{p.label}</span>
        <span className="ml-2 text-xs text-ink-muted">
          {PROVIDER_LABELS[p.type]}
        </span>
        {p.isDefault && (
          <span className="ml-2 rounded-full bg-ink-strong px-2.5 py-0.5 text-xs font-medium text-surface">
            {t("providers.default")}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          {t("providers.edit")}
        </Button>
        {!p.isDefault && (
          <Button size="sm" variant="secondary" onClick={onSetDefault}>
            {t("providers.setDefault")}
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={onRemove}>
          {t("providers.remove")}
        </Button>
      </div>
    </div>
  );
};
