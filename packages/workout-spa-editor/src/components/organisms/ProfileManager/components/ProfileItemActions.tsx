/**
 * ProfileItemActions Component
 *
 * Action buttons for profile item.
 */

import { Download, Trash2 } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";
import type { Profile } from "../../../../types/profile";

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
  return (
    <div className="flex gap-2">
      {!isActive && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSwitch(profile.id)}
        >
          Set Active
        </Button>
      )}
      <Button variant="secondary" size="sm" onClick={() => onEdit(profile)}>
        Edit
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onExport(profile)}
        aria-label="Export profile"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onDelete(profile.id)}
        disabled={!canDelete}
        aria-label="Delete profile"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
