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

// A pasted key often carries a space or a newline the provider rejects, so
// the key is trimmed before it is checked or stored; Save stays disabled
// until it holds more than spaces. The fields lock while the key is checked.
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
  const key = apiKey.trim();

  const handleSubmit = async () => {
    setStatus("checking");
    const outcome = await onAdd({ type, apiKey: key, label });
    if (outcome === "saved" || outcome === "unverified") return onDone();
    setStatus(outcome);
  };

  return (
    <div className="space-y-3 rounded-lg border border-edge p-4">
      <fieldset disabled={checking} className="space-y-3">
        <Input
          label={t("providers.provider")}
          variant="select"
          autoFocus
          value={type}
          onChange={(e) => setType(e.target.value as LlmProviderType)}
          options={PROVIDER_TYPE_OPTIONS}
        />
        <Input
          label={t("providers.apiKey")}
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Input
          label={t("accounts.labelOptional")}
          placeholder={t("accounts.labelPlaceholder")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </fieldset>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={checking || !key}
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
