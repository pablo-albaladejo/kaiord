/**
 * ProfileItemInfo Component
 *
 * Profile information display.
 */

import { User } from "lucide-react";
import type { Profile } from "../../../../types/profile";

type ProfileItemInfoProps = {
  profile: Profile;
};

export function ProfileItemInfo({ profile }: ProfileItemInfoProps) {
  return (
    <div className="flex items-center gap-3">
      <User className="h-5 w-5 text-gray-400" />
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          {profile.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {profile.ftp && `FTP: ${profile.ftp}W`}
          {profile.ftp && profile.maxHeartRate && " • "}
          {profile.maxHeartRate && `Max HR: ${profile.maxHeartRate} bpm`}
        </p>
      </div>
    </div>
  );
}
