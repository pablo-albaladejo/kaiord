import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { KeyCheckMessage, type KeyCheckStatus } from "./KeyCheckMessage";
import type { KeySaveOutcome } from "./save-with-key-check";

export type ProviderEditMode = "rename" | "key";

type ProviderEditRowProps = {
  provider: LlmProviderConfig;
  mode: ProviderEditMode;
  onSave: (updates: {
    label: string;
    apiKey: string | undefined;
  }) => Promise<KeySaveOutcome>;
  onCancel: () => void;
};

/** Renames an account, or replaces its key; one field at a time. */
export const ProviderEditRow: React.FC<ProviderEditRowProps> = ({
  provider,
  mode,
  onSave,
  onCancel,
}) => {
  const t = useTranslate("settings");
  const [value, setValue] = useState(mode === "rename" ? provider.label : "");
  const [status, setStatus] = useState<KeyCheckStatus>("idle");
  const renaming = mode === "rename";

  const handleSave = async () => {
    setStatus("checking");
    setStatus(
      await onSave(
        renaming
          ? { label: value.trim(), apiKey: undefined }
          : { label: provider.label, apiKey: value.trim() }
      )
    );
  };

  return (
    <div className="space-y-2 rounded-lg border border-edge-strong p-3">
      {/* The stored key is never put back into the DOM: the field starts empty. */}
      <Input
        label={renaming ? t("providers.label") : t("accounts.newKey")}
        type={renaming ? "text" : "password"}
        autoComplete="off"
        autoFocus
        placeholder={renaming ? undefined : "sk-..."}
        value={value}
        disabled={status === "checking"}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={status === "checking" || !value.trim()}
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
