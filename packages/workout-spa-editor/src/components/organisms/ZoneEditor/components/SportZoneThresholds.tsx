/**
 * SportZoneThresholds Component
 *
 * Threshold inputs for a sport based on its capabilities.
 */

import type { SportThresholds } from "../../../../types/sport-zones";
import { PaceInput } from "./PaceInput";
import { ThresholdInput } from "./ThresholdInput";

type SportZoneThresholdsProps = {
  thresholds: SportThresholds;
  capabilities: { hr: boolean; power: boolean; pace: boolean };
  onChange: (thresholds: SportThresholds) => void;
};

export function SportZoneThresholds({
  thresholds,
  capabilities,
  onChange,
}: SportZoneThresholdsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-4">
      {capabilities.hr && (
        <ThresholdInput
          label="LTHR"
          unit="bpm"
          value={thresholds.lthr}
          onChange={(v) => onChange({ ...thresholds, lthr: v })}
        />
      )}
      {capabilities.power && (
        <ThresholdInput
          label="FTP"
          unit="watts"
          value={thresholds.ftp}
          onChange={(v) => onChange({ ...thresholds, ftp: v })}
        />
      )}
      {capabilities.pace && (
        <PaceInput
          label="Threshold Pace"
          unit={thresholds.paceUnit === "min_per_100m" ? "/100m" : "/km"}
          value={thresholds.thresholdPace}
          onChange={(v) =>
            onChange({
              ...thresholds,
              thresholdPace: v,
              paceUnit: thresholds.paceUnit ?? "min_per_km",
            })
          }
        />
      )}
    </div>
  );
}
