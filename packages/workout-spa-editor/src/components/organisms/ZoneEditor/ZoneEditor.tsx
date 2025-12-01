/**
 * ZoneEditor Component
 *
 * Visual editor for power and heart rate training zones.
 *
 * Requirements:
 * - Requirement 10: Zone configuration with visual editor
 * - Requirement 11: Multiple profiles with zone management
 */

import type { HeartRateZone, PowerZone, Profile } from "../../../types/profile";
import { ValidationErrors } from "./components/ValidationErrors";
import { ZoneCard } from "./components/ZoneCard";
import { ZoneEditorActions } from "./components/ZoneEditorActions";
import { ZoneEditorHeader } from "./components/ZoneEditorHeader";
import { useZoneEditor } from "./hooks/useZoneEditor";

export type ZoneEditorProps = {
  profile: Profile;
  zoneType: "power" | "heartRate";
  onSave: (zones: Array<PowerZone> | Array<HeartRateZone>) => void;
  onCancel: () => void;
};

export const ZoneEditor: React.FC<ZoneEditorProps> = ({
  profile,
  zoneType,
  onSave,
  onCancel,
}) => {
  const {
    zones,
    validationErrors,
    isPowerZones,
    handleZoneChange,
    handleSave,
  } = useZoneEditor(profile, zoneType, onSave);

  return (
    <div className="space-y-6">
      <ZoneEditorHeader
        isPowerZones={isPowerZones}
        zonesCount={zones.length}
        profile={profile}
      />

      <ValidationErrors errors={validationErrors} />

      <div className="space-y-3">
        {zones.map((zone, index) => {
          const hasError = validationErrors.some((e) => e.zone === zone.zone);

          return (
            <ZoneCard
              key={zone.zone}
              zone={zone}
              index={index}
              isPowerZones={isPowerZones}
              hasError={hasError}
              profile={profile}
              onZoneChange={handleZoneChange}
            />
          );
        })}
      </div>

      <ZoneEditorActions
        onSave={handleSave}
        onCancel={onCancel}
        hasErrors={validationErrors.length > 0}
      />
    </div>
  );
};
