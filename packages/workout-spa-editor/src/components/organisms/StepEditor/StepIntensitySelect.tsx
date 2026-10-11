import { useTranslate } from "../../../i18n/use-translate";
import type { Intensity } from "../../../types/krd";
import { Input } from "../../atoms/Input/Input";

const INTENSITIES: ReadonlyArray<Intensity> = [
  "warmup",
  "active",
  "interval",
  "recovery",
  "rest",
  "cooldown",
  "other",
];

type StepIntensitySelectProps = {
  value: Intensity;
  onChange: (intensity: Intensity) => void;
};

/** What the step is for: warm-up, work, recovery, cool-down… */
export function StepIntensitySelect({
  value,
  onChange,
}: StepIntensitySelectProps) {
  const t = useTranslate("editor");
  return (
    <Input
      variant="select"
      label={t("stepEditor.intensityLabel")}
      aria-label={t("stepEditor.intensityAria")}
      value={value}
      onChange={(event) => onChange(event.target.value as Intensity)}
      options={INTENSITIES.map((intensity) => ({
        value: intensity,
        label: t(`intensity.${intensity}`),
      }))}
    />
  );
}
