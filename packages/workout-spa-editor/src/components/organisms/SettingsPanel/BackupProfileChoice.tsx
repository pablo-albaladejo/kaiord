import { useState } from "react";

import type { ProfileChoice } from "../../../application/sync/reconcile-auto-profile";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

type BackupProfileChoiceProps = {
  candidates: ProfileChoice[];
  onChoose: (profileId: string) => void;
  onCancel: () => void;
};

export const BackupProfileChoice: React.FC<BackupProfileChoiceProps> = ({
  candidates,
  onChoose,
  onCancel,
}) => {
  const t = useTranslate("settings");
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <fieldset className="mt-3 space-y-2 rounded-lg border border-edge p-3">
      <legend className="px-1 text-sm text-ink-body">
        {t("privacy.importChooseProfile")}
      </legend>
      {candidates.map((c) => (
        <label key={c.id} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="backup-import-profile"
            value={c.id}
            checked={picked === c.id}
            onChange={() => setPicked(c.id)}
          />
          {c.name}
        </label>
      ))}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          disabled={picked === null}
          onClick={() => picked && onChoose(picked)}
        >
          {t("privacy.importConfirm")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          {t("providers.cancel")}
        </Button>
      </div>
    </fieldset>
  );
};
