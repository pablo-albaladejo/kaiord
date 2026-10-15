import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";

type RemoveProviderButtonProps = { label: string; onRemove: () => void };

/** Remove, behind a confirmation naming the provider. */
export function RemoveProviderButton({
  label,
  onRemove,
}: RemoveProviderButtonProps) {
  const t = useTranslate("settings");
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
        {t("providers.remove")}
      </Button>
      <ConfirmationModal
        isOpen={confirming}
        title={t("providers.removeTitle", { label })}
        message={t("providers.removeMessage")}
        confirmLabel={t("providers.remove")}
        cancelLabel={t("providers.cancel")}
        variant="destructive"
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
