/**
 * ZonePreview Component
 *
 * Preview of calculated zone values.
 */

import type { PowerZone, Profile } from "../../../../types/profile";

type ZonePreviewProps = {
  zone: PowerZone;
  profile: Profile;
};

export function ZonePreview({ zone, profile }: ZonePreviewProps) {
  if (!profile.ftp) return null;

  return (
    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
      {Math.round((profile.ftp * zone.minPercent) / 100)}W -{" "}
      {Math.round((profile.ftp * zone.maxPercent) / 100)}W
    </div>
  );
}
