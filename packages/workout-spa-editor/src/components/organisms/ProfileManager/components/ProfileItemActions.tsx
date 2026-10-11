/**
 * ProfileItemActions Component
 *
 * Action buttons for profile item.
 */

import { Download, Trash2 } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import type { Profile } from "../../../../types/profile";
import { Button } from "../../../atoms/Button/Button";

type ProfileItemActionsProps = {
  profile: Profile;
  isActive: boolean;
  canDelete: boolean;
  onSwitch: (profileId: string) => void;
  onEdit: (profile: Profile) => void;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

export function ProfileItemActions({
  profile,
  isActive,
  canDelete,
  onSwitch,
  onEdit,
  onExport,
  onDelete,
}: ProfileItemActionsProps) {
  const t = useTranslate("athlete");
  return (
    <div className="flex gap-2">
      {!isActive && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSwitch(profile.id)}
        >
          {t("profileManager.setActive")}
        </Button>
      )}
      <Button variant="secondary" size="sm" onClick={() => onEdit(profile)}>
        {t("profileManager.edit")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onExport(profile)}
        aria-label={t("profileManager.export")}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onDelete(profile.id)}
        disabled={!canDelete}
        aria-label={t("profileManager.delete")}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
