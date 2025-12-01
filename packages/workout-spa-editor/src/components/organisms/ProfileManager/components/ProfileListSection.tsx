/**
 * ProfileListSection Component
 *
 * Section displaying the list of saved profiles.
 */

import type { Profile } from "../../../../types/profile";
import { ProfileList } from "../ProfileList";

type ProfileListSectionProps = {
  profiles: Profile[];
  activeProfileId: string | null;
  onSwitch: (profileId: string) => void;
  onEdit: (profile: Profile) => void;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

export function ProfileListSection({
  profiles,
  activeProfileId,
  onSwitch,
  onEdit,
  onExport,
  onDelete,
}: ProfileListSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
        Saved Profiles ({profiles.length})
      </h3>
      <ProfileList
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSwitch={onSwitch}
        onEdit={onEdit}
        onExport={onExport}
        onDelete={onDelete}
      />
    </div>
  );
}
