import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { KeyCheckMessage } from "./KeyCheckMessage";
import { ProviderEditRow } from "./ProviderEditRow";
import { ProviderRow } from "./ProviderRow";
import type { KeySaveOutcome } from "./save-with-key-check";

type ProviderListProps = {
  providers: Array<LlmProviderConfig>;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
  onUpdate: (
    provider: LlmProviderConfig,
    updates: { label: string; apiKey: string }
  ) => Promise<KeySaveOutcome>;
};

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  onRemove,
  onSetDefault,
  onUpdate,
}) => {
  const t = useTranslate("settings");
  const [editingId, setEditingId] = useState<string | null>(null);
  // An unchecked key closes the row like a saved one, so its note is kept
  // under the provider it belongs to.
  const [uncheckedId, setUncheckedId] = useState<string | null>(null);

  if (providers.length === 0) {
    return <p className="text-sm text-ink-muted">{t("providers.empty")}</p>;
  }

  return (
    <ul
      role="list"
      aria-label={t("providers.listAriaLabel")}
      className="space-y-2"
    >
      {providers.map((p) => (
        <li key={p.id}>
          {editingId === p.id ? (
            <ProviderEditRow
              provider={p}
              onSave={async (updates) => {
                const outcome = await onUpdate(p, updates);
                if (outcome !== "saved" && outcome !== "unverified")
                  return outcome;
                setEditingId(null);
                setUncheckedId(outcome === "unverified" ? p.id : null);
                return outcome;
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ProviderRow
              provider={p}
              onEdit={() => {
                setUncheckedId(null);
                setEditingId(p.id);
              }}
              onRemove={() => onRemove(p.id)}
              onSetDefault={() => onSetDefault(p.id)}
            />
          )}
          {uncheckedId === p.id && editingId !== p.id && (
            <KeyCheckMessage status="unverified" />
          )}
        </li>
      ))}
    </ul>
  );
};
