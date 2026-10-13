import { useState } from "react";

import { useSync } from "../../../contexts/sync-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { useWipeAllData } from "./use-wipe-all-data";
import { WipeAllDataDialog } from "./WipeAllDataDialog";

export const WipeAllDataSection: React.FC = () => {
  const t = useTranslate("settings");
  const toast = useToastContext();
  const { status } = useSync();
  const wipe = useWipeAllData();
  const [open, setOpen] = useState(false);

  const onConfirm = async () => {
    try {
      await wipe();
    } catch {
      toast.error(t("data.wipeFailed"));
    }
  };

  return (
    <div>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid="wipe-open"
      >
        {t("data.wipe")}
      </Button>
      <p className="mt-2 text-xs text-ink-muted">{t("data.wipeHint")}</p>
      <WipeAllDataDialog
        open={open}
        syncing={status === "syncing"}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
};
