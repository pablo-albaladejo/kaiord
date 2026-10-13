import { useTranslate } from "../../../i18n/use-translate";
import { formatThreshold, parseThreshold } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { ThresholdField } from "../AthletePage/ThresholdField";
import { useThresholdWrites } from "../AthletePage/use-threshold-writes";

type GenericThresholdFieldProps = {
  profile: Profile;
};

/* The generic sport is not on the Athlete page, so its one threshold, LTHR,
   is edited beside its zones: still one home for the value. */
export function GenericThresholdField({ profile }: GenericThresholdFieldProps) {
  const t = useTranslate("athlete");
  const hrUnit = useTranslate("common")("units.hr");
  const { saved, write } = useThresholdWrites(profile.id, "generic");
  const lthr = profile.sportZones.generic?.thresholds.lthr;

  return (
    <div className="flex max-w-xs flex-col gap-1">
      <ThresholdField
        label={t("thresholds.lthr", { unit: hrUnit })}
        shown={formatThreshold("lthr", lthr, "min_per_km", "metric")}
        parse={(raw) => parseThreshold("lthr", raw, "min_per_km", "metric")}
        onSave={(value) => write("lthr", value)}
        invalidMessage={t("thresholds.invalid.heartRate")}
        placeholder="170"
        numeric
      />
      <p role="status" className="m-0 h-4 text-[13px] text-ink-muted">
        {saved ? t("thresholds.saved") : ""}
      </p>
    </div>
  );
}
