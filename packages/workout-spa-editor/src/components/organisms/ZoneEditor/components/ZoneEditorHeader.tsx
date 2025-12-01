/**
 * ZoneEditorHeader Component
 *
 * Header for zone editor.
 */

import type { Profile } from "../../../../types/profile";

type ZoneEditorHeaderProps = {
  isPowerZones: boolean;
  zonesCount: number;
  profile: Profile;
};

export function ZoneEditorHeader({
  isPowerZones,
  zonesCount,
  profile,
}: ZoneEditorHeaderProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {isPowerZones ? "Power Zones" : "Heart Rate Zones"}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {isPowerZones
          ? `Configure ${zonesCount} power zones based on FTP${profile.ftp ? ` (${profile.ftp}W)` : ""}`
          : `Configure ${zonesCount} heart rate zones based on max HR${profile.maxHeartRate ? ` (${profile.maxHeartRate} bpm)` : ""}`}
      </p>
    </div>
  );
}
