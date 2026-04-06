import type { LlmProviderConfig } from "../../../store/ai-store";
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
}) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
    <div>
      <span className="font-medium">{p.label}</span>
      <span className="ml-2 text-xs text-gray-500">
        {PROVIDER_LABELS[p.type]} &middot; {p.model}
      </span>
      {p.isDefault && (
        <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          Default
        </span>
      )}
    </div>
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={onEdit}>
        Edit
      </Button>
      {!p.isDefault && (
        <Button size="sm" variant="secondary" onClick={onSetDefault}>
          Set Default
        </Button>
      )}
      <Button size="sm" variant="danger" onClick={onRemove}>
        Remove
      </Button>
    </div>
  </div>
);
