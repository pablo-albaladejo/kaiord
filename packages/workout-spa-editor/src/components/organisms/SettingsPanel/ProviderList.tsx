import { useState } from "react";
import { ProviderEditRow } from "./ProviderEditRow";
import { ProviderRow } from "./ProviderRow";
import type { LlmProviderConfig } from "../../../store/ai-store";

type ProviderListProps = {
  providers: Array<LlmProviderConfig>;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Omit<LlmProviderConfig, "id">>
  ) => void;
};

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  onRemove,
  onSetDefault,
  onUpdate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (providers.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No providers configured. Add one below.
      </p>
    );
  }

  return (
    <ul role="list" aria-label="Configured LLM providers" className="space-y-2">
      {providers.map((p) => (
        <li key={p.id}>
          {editingId === p.id ? (
            <ProviderEditRow
              provider={p}
              onSave={(id, updates) => {
                onUpdate(id, updates);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ProviderRow
              provider={p}
              onEdit={() => setEditingId(p.id)}
              onRemove={() => onRemove(p.id)}
              onSetDefault={() => onSetDefault(p.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
};
