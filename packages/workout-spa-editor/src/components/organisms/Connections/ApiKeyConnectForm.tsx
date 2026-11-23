import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { logFailure } from "../../../lib/log-failure";
import { isApiKeyRefused } from "../../../types/api-key-refused-error";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";

const REFUSAL_KEYS = {
  "missing-key": "manage.apiKeyMissing",
  rejected: "manage.apiKeyRejected",
} as const;

/** A verified refusal names its fix; anything else states no cause. */
const failureKey = (caught: unknown) => {
  if (isApiKeyRefused(caught)) return REFUSAL_KEYS[caught.reason];
  logFailure("api-key-connect", caught);
  return "manage.connectFailed";
};

type ApiKeyConnectFormProps = {
  /** Resolves on success; rejects (throwing) on an invalid key. */
  onConnect: (apiKey: string) => Promise<void>;
  onCancel: () => void;
};

export function ApiKeyConnectForm({
  onConnect,
  onCancel,
}: ApiKeyConnectFormProps) {
  const t = useTranslate("connections");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConnect(apiKey.trim());
    } catch (caught) {
      setError(t(failureKey(caught)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <Input
        type="password"
        label={t("manage.apiKey")}
        autoComplete="off"
        value={apiKey}
        error={error ?? undefined}
        onChange={(event) => setApiKey(event.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={busy || apiKey.trim() === ""}
          onClick={() => void submit()}
        >
          {busy ? t("manage.connecting") : t("manage.connect")}
        </Button>
        <Button size="sm" variant="tertiary" disabled={busy} onClick={onCancel}>
          {t("manage.cancel")}
        </Button>
      </div>
    </div>
  );
}
