import { useState } from "react";

import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";

type ApiKeyConnectFormProps = {
  /** Resolves on success; rejects (throwing) on an invalid key. */
  onConnect: (apiKey: string) => Promise<void>;
  onCancel: () => void;
};

export function ApiKeyConnectForm({
  onConnect,
  onCancel,
}: ApiKeyConnectFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConnect(apiKey.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not connect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <Input
        type="password"
        label="API key"
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
          {busy ? "Connecting…" : "Connect"}
        </Button>
        <Button size="sm" variant="tertiary" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
