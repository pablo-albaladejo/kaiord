import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";

type ProviderEditRowProps = {
  provider: LlmProviderConfig;
  onSave: (id: string, updates: Partial<Omit<LlmProviderConfig, "id">>) => void;
  onCancel: () => void;
};

export const ProviderEditRow: React.FC<ProviderEditRowProps> = ({
  provider,
  onSave,
  onCancel,
}) => {
  const t = useTranslate("settings");
  const [label, setLabel] = useState(provider.label);
  const [apiKey, setApiKey] = useState(provider.apiKey);

  return (
    <div className="space-y-2 rounded-lg border border-blue-200 p-3 dark:border-blue-700">
      <Input
        label={t("providers.label")}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <Input
        label={t("providers.apiKey")}
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(provider.id, { label, apiKey })}
          disabled={!label || !apiKey}
        >
          {t("providers.save")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          {t("providers.cancel")}
        </Button>
      </div>
    </div>
  );
};
