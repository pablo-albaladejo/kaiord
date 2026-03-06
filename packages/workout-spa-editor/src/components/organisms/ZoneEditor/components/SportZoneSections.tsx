/**
 * SportZoneSections Component
 *
 * Renders zone type sections based on sport capabilities.
 */

import { ZoneTypeSection } from "./ZoneTypeSection";
import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportZoneConfig } from "../../../../types/sport-zones";
import type { ZoneMode } from "../../../../types/sport-zones";

type SportZoneSectionsProps = {
  config: SportZoneConfig;
  capabilities: { hr: boolean; power: boolean; pace: boolean };
  onToggleMode: (zoneType: ZoneType, mode: ZoneMode) => void;
};

export function SportZoneSections({
  config,
  capabilities,
  onToggleMode,
}: SportZoneSectionsProps) {
  return (
    <div className="space-y-4">
      {capabilities.hr && (
        <ZoneTypeSection
          title="Heart Rate Zones"
          mode={config.heartRateZones.mode}
          zones={config.heartRateZones.zones}
          zoneDisplayType="heartRate"
          onToggleMode={(m) => onToggleMode("heartRateZones", m)}
        />
      )}
      {capabilities.power && config.powerZones && (
        <ZoneTypeSection
          title="Power Zones"
          mode={config.powerZones.mode}
          zones={config.powerZones.zones}
          zoneDisplayType="power"
          onToggleMode={(m) => onToggleMode("powerZones", m)}
        />
      )}
      {capabilities.pace && config.paceZones && (
        <ZoneTypeSection
          title="Pace Zones"
          mode={config.paceZones.mode}
          zones={config.paceZones.zones}
          zoneDisplayType="pace"
          onToggleMode={(m) => onToggleMode("paceZones", m)}
        />
      )}
    </div>
  );
}
