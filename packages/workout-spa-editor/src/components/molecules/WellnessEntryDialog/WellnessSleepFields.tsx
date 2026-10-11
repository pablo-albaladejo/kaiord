import { useTranslate } from "../../../i18n/use-translate";
import type { SleepFields } from "./sleep-entry-fields";
import { WellnessMetricField } from "./WellnessMetricField";

export type WellnessSleepFieldsProps = {
  fields: SleepFields;
  onChange: (key: keyof SleepFields) => (value: string) => void;
};

/** Hours slept (h:mm), an optional score, and optional bedtime/wake time. */
export function WellnessSleepFields({
  fields,
  onChange,
}: WellnessSleepFieldsProps) {
  const t = useTranslate("health");
  return (
    <>
      <WellnessMetricField
        label={t("wellnessEntry.sleepHours")}
        unit="h:mm"
        type="text"
        placeholder="7:30"
        focusKey="sleep"
        value={fields.hours}
        onChange={onChange("hours")}
      />
      <WellnessMetricField
        label={t("wellnessEntry.sleepScore")}
        value={fields.score}
        onChange={onChange("score")}
        min={0}
        max={100}
        step={1}
      />
      <div className="grid grid-cols-2 gap-3">
        <WellnessMetricField
          label={t("wellnessEntry.bedtime")}
          type="time"
          value={fields.bedtime}
          onChange={onChange("bedtime")}
        />
        <WellnessMetricField
          label={t("wellnessEntry.wakeTime")}
          type="time"
          value={fields.wakeTime}
          onChange={onChange("wakeTime")}
        />
      </div>
    </>
  );
}
