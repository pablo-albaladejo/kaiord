import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { type ProviderEditMode, ProviderEditRow } from "./ProviderEditRow";
import { ProviderRow } from "./ProviderRow";
import type { KeySaveOutcome } from "./save-with-key-check";

type ProviderListProps = {
  providers: Array<LlmProviderConfig>;
  onRemove: (id: string) => void;
  onRemoved?: () => void;
  onUpdate: (
    provider: LlmProviderConfig,
    updates: { label: string; apiKey: string | undefined }
  ) => Promise<KeySaveOutcome>;
};

type Editing = { id: string; mode: ProviderEditMode } | null;

// An unchecked key closes the row like a saved one: the row's key status
// then says the key was not checked, so no note is left behind.
const closes = (outcome: KeySaveOutcome) =>
  outcome === "saved" || outcome === "unverified";

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  onRemove,
  onRemoved,
  onUpdate,
}) => {
  const t = useTranslate("settings");
  const [editing, setEditing] = useState<Editing>(null);

  if (providers.length === 0) {
    return <p className="text-sm text-ink-muted">{t("accounts.empty")}</p>;
  }

  return (
    <ul
      role="list"
      aria-label={t("accounts.listAriaLabel")}
      className="space-y-2"
    >
      {providers.map((p) => (
        <li key={p.id}>
          {editing?.id === p.id ? (
            <ProviderEditRow
              provider={p}
              mode={editing.mode}
              onSave={async (updates) => {
                const outcome = await onUpdate(p, updates);
                if (closes(outcome)) setEditing(null);
                return outcome;
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <ProviderRow
              provider={p}
              onReplaceKey={() => setEditing({ id: p.id, mode: "key" })}
              onRename={() => setEditing({ id: p.id, mode: "rename" })}
              onRemove={() => onRemove(p.id)}
              onRemoved={onRemoved}
            />
          )}
        </li>
      ))}
    </ul>
  );
};
