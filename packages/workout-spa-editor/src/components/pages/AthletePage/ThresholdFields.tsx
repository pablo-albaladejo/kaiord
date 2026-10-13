import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import {
  type ActiveSport,
  deriveThresholdProvenance,
  formatThreshold,
  parseThreshold,
  sportPaceBase,
  storedThreshold,
  thresholdFieldLabel,
  type ThresholdFieldSpec,
  thresholdFieldSpecs,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { ThresholdField } from "./ThresholdField";

type ThresholdFieldsProps = {
  profile: Profile;
  sport: ActiveSport;
  onSave: (spec: ThresholdFieldSpec, value: number | undefined) => void;
};

const INVALID_KEY = {
  ftp: "thresholds.invalid.whole",
  lthr: "thresholds.invalid.heartRate",
  maxHeartRate: "thresholds.invalid.heartRate",
  thresholdPace: "thresholds.invalid.pace",
} as const;

const PLACEHOLDER = {
  ftp: "250",
  lthr: "170",
  maxHeartRate: "190",
  thresholdPace: "4:30",
} as const;

/** The active sport's thresholds and the max heart rate, as fields. */
export function ThresholdFields({
  profile,
  sport,
  onSave,
}: ThresholdFieldsProps) {
  const t = useTranslate("athlete");
  const hrUnit = useTranslate("common")("units.hr");
  const units = useUnits();
  const base =
    profile.sportZones[sport]?.thresholds.paceUnit ?? sportPaceBase(sport);
  const ctx = { swimming: sport === "swimming", base, units, hrUnit, t };
  const now = new Date();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {thresholdFieldSpecs(sport).map((spec) => {
        const value = storedThreshold(profile, sport, spec.id);
        return (
          <ThresholdField
            key={spec.id}
            label={thresholdFieldLabel(spec, ctx)}
            shown={formatThreshold(spec.id, value, base, units)}
            parse={(raw) => parseThreshold(spec.id, raw, base, units)}
            onSave={(next) => onSave(spec, next)}
            invalidMessage={t(INVALID_KEY[spec.id])}
            placeholder={PLACEHOLDER[spec.id]}
            numeric={spec.id !== "thresholdPace"}
            hint={spec.optional ? t("thresholds.optional") : undefined}
            provenance={
              spec.provenance &&
              deriveThresholdProvenance(profile, spec.provenance, value, now)
            }
          />
        );
      })}
    </div>
  );
}
