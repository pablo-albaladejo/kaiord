/**
 * ProfileList Component
 *
 * Displays list of saved profiles with actions.
 */

import { ProfileListItem } from "./components/ProfileListItem";
import type { Profile } from "../../../types/profile";

type ProfileListProps = {
  profiles: Array<Profile>;
  activeProfileId: string | null;
  onSwitch: (profileId: string) => void;
  onEdit: (profile: Profile) => void;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

export function ProfileList({
  profiles,
  activeProfileId,
  onSwitch,
  onEdit,
  onExport,
  onDelete,
}: ProfileListProps) {
  if (profiles.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No profiles yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile) => (
        <ProfileListItem
          key={profile.id}
          profile={profile}
          isActive={profile.id === activeProfileId}
          canDelete={profiles.length > 1}
          onSwitch={onSwitch}
          onEdit={onEdit}
          onExport={onExport}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
