/**
 * SportZoneSections Component
 *
 * Renders zone type sections based on sport capabilities.
 */

import { ZoneTypeSection } from "./ZoneTypeSection";
import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportZoneConfig } from "../../../../types/sport-zones";
import type { ZoneRowData } from "../types/zone-table";

type SportZoneSectionsProps = {
  config: SportZoneConfig;
  capabilities: { hr: boolean; power: boolean; pace: boolean };
  onMethodChange: (zoneType: ZoneType, method: string) => void;
  onZonesChange: (zoneType: ZoneType, zones: Array<ZoneRowData>) => void;
  onAddZone: (zoneType: ZoneType) => void;
  ftp?: number;
};

export function SportZoneSections({
  config,
  capabilities,
  onMethodChange,
  onZonesChange,
  onAddZone,
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
          onZonesChange={(z) => onZonesChange("heartRateZones", z)}
          onAddZone={() => onAddZone("heartRateZones")}
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
          onZonesChange={(z) => onZonesChange("powerZones", z)}
          onAddZone={() => onAddZone("powerZones")}
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
          onZonesChange={(z) => onZonesChange("paceZones", z)}
          onAddZone={() => onAddZone("paceZones")}
          threshold={config.thresholds.thresholdPace}
        />
      )}
    </div>
  );
}
