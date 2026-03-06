/**
 * SportZoneSections Component
 *
 * Renders zone type sections based on sport capabilities.
 */

import { ZoneTypeSection } from "./ZoneTypeSection";
import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportZoneConfig } from "../../../../types/sport-zones";

type SportZoneSectionsProps = {
  config: SportZoneConfig;
  capabilities: { hr: boolean; power: boolean; pace: boolean };
  onMethodChange: (zoneType: ZoneType, method: string) => void;
  ftp?: number;
};

export function SportZoneSections({
  config,
  capabilities,
  onMethodChange,
  ftp,
}: SportZoneSectionsProps) {
  return (
    <div className="space-y-4">
      {capabilities.hr && (
        <ZoneTypeSection
          title="Heart Rate Zones"
          method={config.heartRateZones.method}
          zones={config.heartRateZones.zones}
          zoneDisplayType="heartRate"
          onMethodChange={(m) => onMethodChange("heartRateZones", m)}
          threshold={config.thresholds.lthr}
        />
      )}
      {capabilities.power && config.powerZones && (
        <ZoneTypeSection
          title="Power Zones"
          method={config.powerZones.method}
          zones={config.powerZones.zones}
          zoneDisplayType="power"
          onMethodChange={(m) => onMethodChange("powerZones", m)}
          threshold={ftp}
        />
      )}
      {capabilities.pace && config.paceZones && (
        <ZoneTypeSection
          title="Pace Zones"
          method={config.paceZones.method}
          zones={config.paceZones.zones}
          zoneDisplayType="pace"
          onMethodChange={(m) => onMethodChange("paceZones", m)}
          threshold={config.thresholds.thresholdPace}
        />
      )}
    </div>
  );
}
