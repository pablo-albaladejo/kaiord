/**
 * EncryptionSection — Settings control for optional end-to-end encryption.
 *
 * Off by default. When enabled, snapshots are encrypted with a
 * user-supplied passphrase before upload (the passphrase is held only in
 * memory, never persisted). When AI provider keys are present and
 * encryption is off, a one-time warning explains those keys will be
 * uploaded in effectively cleartext form.
 */

import { Input } from "../../atoms/Input";
import { Toggle } from "../../atoms/Toggle";
import { useEncryptionSection } from "./use-encryption-section";

const WARNING_TEXT =
  "Your saved AI API keys will be uploaded without end-to-end encryption. " +
  "Enable encryption below to protect them.";

export type EncryptionSectionProps = {
  /** Whether the database currently holds any AI provider keys. */
  hasAiKeys: boolean;
};

export const EncryptionSection: React.FC<EncryptionSectionProps> = ({
  hasAiKeys,
}) => {
  const { enabled, passphrase, showWarning, toggle, setPassphrase } =
    useEncryptionSection(hasAiKeys);

  return (
    <div className="space-y-3" data-testid="encryption-section">
      {showWarning && (
        <p
          data-testid="plaintext-warning"
          className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          {WARNING_TEXT}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          End-to-end encryption
        </span>
        <Toggle checked={enabled} onCheckedChange={toggle} />
      </div>
      {enabled && (
        <Input
          type="password"
          label="Passphrase"
          autoComplete="off"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
        />
      )}
    </div>
  );
};
