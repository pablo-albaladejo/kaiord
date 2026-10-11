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
  const ftp = profile.sportZones.cycling?.thresholds.ftp;
  if (!ftp) return null;

  const watts = (percent: number) => Math.round((ftp * percent) / 100);
  return (
    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
      {`${watts(zone.minPercent)}W - ${watts(zone.maxPercent)}W`}
    </div>
  );
}
