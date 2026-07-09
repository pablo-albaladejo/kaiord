/**
 * ZoneEditorActions Component
 *
 * Action buttons for zone editor.
 */

import { Check, X } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button/Button";

type ZoneEditorActionsProps = {
  onSave: () => void;
  onCancel: () => void;
  hasErrors: boolean;
};

export function ZoneEditorActions({
  onSave,
  onCancel,
  hasErrors,
}: ZoneEditorActionsProps) {
  const t = useTranslate("zones");
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        <X className="mr-2 h-4 w-4" />
        {t("actions.cancel")}
      </Button>
      <Button onClick={onSave} disabled={hasErrors}>
        <Check className="mr-2 h-4 w-4" />
        {t("actions.saveZones")}
      </Button>
    </div>
  );
}
