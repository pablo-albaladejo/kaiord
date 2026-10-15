import { PROVIDER_TYPE_NAMES } from "../../../application/ai/provider-label";
import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { keyHint, keyLastFour } from "./key-hint";
import { keyStatusOf } from "./key-status";
import { KeyStatusBadge } from "./KeyStatusBadge";
import { ProviderRowMenu } from "./ProviderRowMenu";

type ProviderRowProps = {
  provider: LlmProviderConfig;
  onReplaceKey: () => void;
  onRename: () => void;
  onRemove: () => void;
};

export const ProviderRow: React.FC<ProviderRowProps> = ({
  provider: p,
  onReplaceKey,
  onRename,
  onRemove,
}) => {
  const t = useTranslate("settings");
  const last4 = keyLastFour(p.apiKey);
  const typeName = PROVIDER_TYPE_NAMES[p.type];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-edge p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span data-testid="account-label" className="break-words font-medium">
            {p.label}
          </span>
          {/* "Anthropic 2" already says which provider it is. */}
          {!p.label.startsWith(typeName) && (
            <span className="text-xs text-ink-muted">{typeName}</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {!p.apiKeyMissing && (
            <span
              className="font-mono text-xs text-ink-muted"
              title={last4 ? t("providers.keyHint", { last4 }) : undefined}
            >
              {keyHint(p.apiKey)}
            </span>
          )}
          <KeyStatusBadge status={keyStatusOf(p)} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="secondary" onClick={onReplaceKey}>
          {t("accounts.replaceKey")}
        </Button>
        <ProviderRowMenu
          label={p.label}
          onRename={onRename}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
};
