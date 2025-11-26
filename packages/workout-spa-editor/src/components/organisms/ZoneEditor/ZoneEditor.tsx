/**
 * ZoneEditor Component
 *
 * Visual editor for power and heart rate training zones.
 *
 * Requirements:
 * - Requirement 10: Zone configuration with visual editor
 * - Requirement 11: Multiple profiles with zone management
 */

import { AlertCircle, Check, X } from "lucide-react";
import { useState } from "react";
import type { HeartRateZone, PowerZone, Profile } from "../../../types/profile";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

// ============================================
// Types
// ============================================

export type ZoneEditorProps = {
  profile: Profile;
  zoneType: "power" | "heartRate";
  onSave: (zones: Array<PowerZone> | Array<HeartRateZone>) => void;
  onCancel: () => void;
};

type ZoneValidationError = {
  zone: number;
  message: string;
};

// ============================================
// Component
// ============================================

export const ZoneEditor: React.FC<ZoneEditorProps> = ({
  profile,
  zoneType,
  onSave,
  onCancel,
}) => {
  const isPowerZones = zoneType === "power";
  const initialZones = isPowerZones
    ? profile.powerZones
    : profile.heartRateZones;

  const [zones, setZones] = useState(initialZones);
  const [validationErrors, setValidationErrors] = useState<
    Array<ZoneValidationError>
  >([]);

  // Validate zones for overlaps and gaps
  const validateZones = (
    zonesToValidate: Array<PowerZone> | Array<HeartRateZone>
  ): Array<ZoneValidationError> => {
    const errors: Array<ZoneValidationError> = [];

    for (let i = 0; i < zonesToValidate.length; i++) {
      const zone = zonesToValidate[i];

      if (isPowerZones) {
        const powerZone = zone as PowerZone;
        if (powerZone.minPercent >= powerZone.maxPercent) {
          errors.push({
            zone: powerZone.zone,
            message: "Min must be less than max",
          });
        }
      } else {
        const hrZone = zone as HeartRateZone;
        if (hrZone.minBpm >= hrZone.maxBpm) {
          errors.push({
            zone: hrZone.zone,
            message: "Min must be less than max",
          });
        }
      }

      // Check for overlaps with next zone
      if (i < zonesToValidate.length - 1) {
        const nextZone = zonesToValidate[i + 1];
        if (isPowerZones) {
          const currentMax = (zone as PowerZone).maxPercent;
          const nextMin = (nextZone as PowerZone).minPercent;
          if (currentMax >= nextMin) {
            errors.push({
              zone: (zone as PowerZone).zone,
              message: "Overlaps with next zone",
            });
          }
        } else {
          const currentMax = (zone as HeartRateZone).maxBpm;
          const nextMin = (nextZone as HeartRateZone).minBpm;
          if (currentMax >= nextMin) {
            errors.push({
              zone: (zone as HeartRateZone).zone,
              message: "Overlaps with next zone",
            });
          }
        }
      }
    }

    return errors;
  };

  // Handle zone value change
  const handleZoneChange = (
    zoneIndex: number,
    field: "name" | "minPercent" | "maxPercent" | "minBpm" | "maxBpm",
    value: string | number
  ) => {
    const updatedZones = [...zones];
    const zone = updatedZones[zoneIndex];

    if (field === "name") {
      zone.name = value as string;
    } else if (
      isPowerZones &&
      (field === "minPercent" || field === "maxPercent")
    ) {
      (zone as PowerZone)[field] = Number(value);
    } else if (!isPowerZones && (field === "minBpm" || field === "maxBpm")) {
      (zone as HeartRateZone)[field] = Number(value);
    }

    setZones(updatedZones);
    setValidationErrors(validateZones(updatedZones));
  };

  // Handle save
  const handleSave = () => {
    const errors = validateZones(zones);
    if (errors.length === 0) {
      onSave(zones);
    } else {
      setValidationErrors(errors);
    }
  };

  // Get zone color for visual preview
  const getZoneColor = (zoneNumber: number): string => {
    const colors = [
      "bg-blue-100 dark:bg-blue-900/30",
      "bg-green-100 dark:bg-green-900/30",
      "bg-yellow-100 dark:bg-yellow-900/30",
      "bg-orange-100 dark:bg-orange-900/30",
      "bg-red-100 dark:bg-red-900/30",
      "bg-purple-100 dark:bg-purple-900/30",
      "bg-pink-100 dark:bg-pink-900/30",
    ];
    return colors[(zoneNumber - 1) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isPowerZones ? "Power Zones" : "Heart Rate Zones"}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isPowerZones
            ? `Configure ${zones.length} power zones based on FTP${profile.ftp ? ` (${profile.ftp}W)` : ""}`
            : `Configure ${zones.length} heart rate zones based on max HR${profile.maxHeartRate ? ` (${profile.maxHeartRate} bpm)` : ""}`}
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Validation Errors
              </h3>
              <ul className="mt-1 space-y-1 text-sm text-red-700 dark:text-red-300">
                {validationErrors.map((error) => (
                  <li key={`${error.zone}-${error.message}`}>
                    Zone {error.zone}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Zone Editor */}
      <div className="space-y-3">
        {zones.map((zone, index) => {
          const hasError = validationErrors.some((e) => e.zone === zone.zone);

          return (
            <div
              key={zone.zone}
              className={`rounded-lg border p-4 ${
                hasError
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getZoneColor(zone.zone)} font-semibold text-gray-900 dark:text-white`}
                >
                  {zone.zone}
                </div>
                <Input
                  value={zone.name}
                  onChange={(e) =>
                    handleZoneChange(index, "name", e.target.value)
                  }
                  placeholder="Zone name"
                  className="flex-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isPowerZones ? (
                  <>
                    <Input
                      label="Min %"
                      type="number"
                      value={(zone as PowerZone).minPercent}
                      onChange={(e) =>
                        handleZoneChange(index, "minPercent", e.target.value)
                      }
                      min={0}
                      max={200}
                    />
                    <Input
                      label="Max %"
                      type="number"
                      value={(zone as PowerZone).maxPercent}
                      onChange={(e) =>
                        handleZoneChange(index, "maxPercent", e.target.value)
                      }
                      min={0}
                      max={200}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Min BPM"
                      type="number"
                      value={(zone as HeartRateZone).minBpm}
                      onChange={(e) =>
                        handleZoneChange(index, "minBpm", e.target.value)
                      }
                      min={0}
                      max={250}
                    />
                    <Input
                      label="Max BPM"
                      type="number"
                      value={(zone as HeartRateZone).maxBpm}
                      onChange={(e) =>
                        handleZoneChange(index, "maxBpm", e.target.value)
                      }
                      min={0}
                      max={250}
                    />
                  </>
                )}
              </div>

              {/* Calculated values preview */}
              {isPowerZones && profile.ftp && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(
                    (profile.ftp * (zone as PowerZone).minPercent) / 100
                  )}
                  W -{" "}
                  {Math.round(
                    (profile.ftp * (zone as PowerZone).maxPercent) / 100
                  )}
                  W
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual Preview Chart */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
          Zone Preview
        </h3>
        <div className="flex h-12 overflow-hidden rounded-md">
          {zones.map((zone) => {
            const width = isPowerZones
              ? (zone as PowerZone).maxPercent - (zone as PowerZone).minPercent
              : (zone as HeartRateZone).maxBpm - (zone as HeartRateZone).minBpm;

            return (
              <div
                key={zone.zone}
                className={`flex items-center justify-center ${getZoneColor(zone.zone)} border-r border-gray-300 last:border-r-0 dark:border-gray-600`}
                style={{
                  width: `${(width / (isPowerZones ? 200 : 250)) * 100}%`,
                }}
                title={`Zone ${zone.zone}: ${zone.name}`}
              >
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {zone.zone}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={validationErrors.length > 0}>
          <Check className="mr-2 h-4 w-4" />
          Save Zones
        </Button>
      </div>
    </div>
  );
};
