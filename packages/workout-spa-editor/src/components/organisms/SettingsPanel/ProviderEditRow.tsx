import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { KeyCheckMessage, type KeyCheckStatus } from "./KeyCheckMessage";
import type { KeySaveOutcome } from "./save-with-key-check";

type ProviderEditRowProps = {
  provider: LlmProviderConfig;
  onSave: (updates: {
    label: string;
    apiKey: string;
  }) => Promise<KeySaveOutcome>;
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
  const [status, setStatus] = useState<KeyCheckStatus>("idle");

  const handleSave = async () => {
    setStatus("checking");
    setStatus(await onSave({ label, apiKey }));
  };

  return (
    <div className="space-y-2 rounded-lg border border-edge-strong p-3">
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
          onClick={() => void handleSave()}
          disabled={status === "checking" || !label || !apiKey}
        >
          {t("providers.save")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          {t("providers.cancel")}
        </Button>
      </div>
      <KeyCheckMessage status={status} />
    </div>
  );
};
