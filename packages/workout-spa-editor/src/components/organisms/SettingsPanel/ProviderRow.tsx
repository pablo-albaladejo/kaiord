import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { keyHint } from "./key-hint";
import { RemoveProviderButton } from "./RemoveProviderButton";

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

type ProviderRowProps = {
  provider: LlmProviderConfig;
  onEdit: () => void;
  onRemove: () => void;
};

export const ProviderRow: React.FC<ProviderRowProps> = ({
  provider: p,
  onEdit,
  onRemove,
}) => {
  const t = useTranslate("settings");
  return (
    <div className="flex items-center justify-between rounded-lg border border-edge p-3">
      <div>
        <span className="font-medium">{p.label}</span>
        <span className="ml-2 text-xs text-ink-muted">
          {PROVIDER_LABELS[p.type]}
        </span>
        {p.apiKeyMissing ? (
          <span className="ml-2 rounded-full border border-danger-border bg-danger-bg px-2.5 py-0.5 text-xs font-medium text-danger-text">
            {t("providers.missingKey")}
          </span>
        ) : (
          <span
            className="ml-2 font-mono text-xs text-ink-muted"
            title={t("providers.keyHint", { last4: p.apiKey.slice(-4) })}
          >
            {keyHint(p.apiKey)}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          {t("providers.edit")}
        </Button>
        <RemoveProviderButton label={p.label} onRemove={onRemove} />
      </div>
    </div>
  );
};
