/**
 * ProfileFormActions Component
 *
 * Action buttons for profile form.
 */

import { Plus } from "lucide-react";
import type { Profile } from "../../../../types/profile";
import { Button } from "../../../atoms/Button/Button";

type ProfileFormActionsProps = {
  editingProfile: Profile | null;
  isNameValid: boolean;
  onCreate: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileFormActions({
  editingProfile,
  isNameValid,
  onCreate,
  onSave,
  onCancel,
}: ProfileFormActionsProps) {
  if (editingProfile) {
    return (
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={!isNameValid}>
          Save Changes
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onCreate} disabled={!isNameValid}>
      <Plus className="mr-2 h-4 w-4" />
      Create Profile
    </Button>
  );
}
