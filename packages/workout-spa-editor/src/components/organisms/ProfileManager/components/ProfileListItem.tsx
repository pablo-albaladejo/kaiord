/**
 * ProfileListItem Component
 *
 * Single profile item in the list.
 */

import { ProfileItemActions } from "./ProfileItemActions";
import { ProfileItemInfo } from "./ProfileItemInfo";
import type { Profile } from "../../../../types/profile";

type ProfileListItemProps = {
  profile: Profile;
  isActive: boolean;
  canDelete: boolean;
  onSwitch: (profileId: string) => void;
  onEdit: (profile: Profile) => void;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

export function ProfileListItem({
  profile,
  isActive,
  canDelete,
  onSwitch,
  onEdit,
  onExport,
  onDelete,
}: ProfileListItemProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        isActive
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <ProfileItemInfo profile={profile} />
      <ProfileItemActions
        profile={profile}
        isActive={isActive}
        canDelete={canDelete}
        onSwitch={onSwitch}
        onEdit={onEdit}
        onExport={onExport}
        onDelete={onDelete}
      />
    </div>
  );
}
