import { Button } from "../../atoms/Button";
import type { LlmProviderConfig } from "../../../store/ai-store";

type ProviderListProps = {
  providers: Array<LlmProviderConfig>;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
};

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  onRemove,
  onSetDefault,
}) => {
  if (providers.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No providers configured. Add one below.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {providers.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
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
            {!p.isDefault && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSetDefault(p.id)}
              >
                Set Default
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={() => onRemove(p.id)}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};
