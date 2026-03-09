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
  const cycling = profile.sportZones.cycling;
  const ftp = cycling?.thresholds.ftp;
  const lthr = cycling?.thresholds.lthr;

  return (
    <div className="flex items-center gap-3">
      <User className="h-5 w-5 text-gray-400" />
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          {profile.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {ftp && `FTP: ${ftp}W`}
          {ftp && lthr && " - "}
          {lthr && `LTHR: ${lthr} bpm`}
        </p>
      </div>
    </div>
  );
}
