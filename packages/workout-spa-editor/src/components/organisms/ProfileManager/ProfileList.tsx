/**
 * ProfileList Component
 *
 * Displays list of saved profiles with actions.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { ProfileListItem } from "./components/ProfileListItem";

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
  const t = useTranslate("athlete");
  if (profiles.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("profileManager.empty")}
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
