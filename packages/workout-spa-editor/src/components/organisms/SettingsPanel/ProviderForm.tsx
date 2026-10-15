import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderType } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { KeyCheckMessage, type KeyCheckStatus } from "./KeyCheckMessage";
import { PROVIDER_TYPE_OPTIONS } from "./provider-type-options";
import type { KeySaveOutcome } from "./save-with-key-check";

type ProviderFormProps = {
  onAdd: (config: {
    type: LlmProviderType;
    apiKey: string;
    label: string;
  }) => Promise<KeySaveOutcome>;
  onDone: () => void;
  onCancel: () => void;
};

export const ProviderForm: React.FC<ProviderFormProps> = ({
  onAdd,
  onDone,
  onCancel,
}) => {
  const t = useTranslate("settings");
  const [type, setType] = useState<LlmProviderType>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<KeyCheckStatus>("idle");
  const checking = status === "checking";

  const handleSubmit = async () => {
    if (!apiKey) return;
    setStatus("checking");
    const outcome = await onAdd({ type, apiKey, label });
    if (outcome === "saved" || outcome === "unverified") return onDone();
    setStatus(outcome);
  };

  return (
    <div className="space-y-3 rounded-lg border border-edge p-4">
      <Input
        label={t("providers.provider")}
        variant="select"
        value={type}
        disabled={checking}
        onChange={(e) => setType(e.target.value as LlmProviderType)}
        options={PROVIDER_TYPE_OPTIONS}
      />
      <Input
        label={t("providers.apiKey")}
        type="password"
        autoComplete="off"
        placeholder="sk-..."
        value={apiKey}
        disabled={checking}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <Input
        label={t("accounts.labelOptional")}
        placeholder={t("accounts.labelPlaceholder")}
        value={label}
        disabled={checking}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={checking || !apiKey}
        >
          {t("accounts.save")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          {t("providers.cancel")}
        </Button>
      </div>
      <KeyCheckMessage status={status} />
    </div>
  );
};
