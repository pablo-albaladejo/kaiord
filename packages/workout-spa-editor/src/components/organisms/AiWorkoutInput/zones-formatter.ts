import type { Profile } from "../../../types/profile";

export const formatZonesContext = (profile: Profile): string => {
  const parts: Array<string> = [];

  if (profile.ftp) {
    parts.push(`FTP: ${profile.ftp}W`);
  }
  if (profile.maxHeartRate) {
    parts.push(`Max HR: ${profile.maxHeartRate}bpm`);
  }

  if (profile.powerZones?.length && profile.ftp) {
    const ftp = profile.ftp;
    const zones = profile.powerZones
      .map(
        (z) =>
          `${z.name}: ${Math.round((ftp * z.minPercent) / 100)}-${Math.round((ftp * z.maxPercent) / 100)}W`
      )
      .join(", ");
    parts.push(`Power zones: ${zones}`);
  }

  if (profile.heartRateZones?.length) {
    const zones = profile.heartRateZones
      .filter((z) => z.maxBpm > 0)
      .map((z) => `${z.name}: ${z.minBpm}-${z.maxBpm}bpm`)
      .join(", ");
    if (zones) parts.push(`HR zones: ${zones}`);
  }

  return parts.join("\n");
};
