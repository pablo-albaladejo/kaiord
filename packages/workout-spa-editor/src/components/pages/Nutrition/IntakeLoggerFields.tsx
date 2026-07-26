import { useTranslate } from "../../../i18n/use-translate";
import type { IntakeLoggerFields as Fields } from "./intake-logger-model";
import { IntakeNumberField } from "./IntakeNumberField";
import { MealSlotField } from "./MealSlotField";

const LABEL_CLASS =
  "mt-1 block w-full rounded border border-edge bg-surface-deep px-2 py-1.5 text-sm text-ink-strong";

export type IntakeLoggerFieldsProps = {
  fields: Fields;
  onChange: (next: Fields) => void;
};

/** The grouped input controls for the intake logger; parent owns state. */
export function IntakeLoggerFields({
  fields,
  onChange,
}: IntakeLoggerFieldsProps) {
  const t = useTranslate("nutrition");
  const set = (key: keyof Fields) => (value: string) =>
    onChange({ ...fields, [key]: value });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <IntakeNumberField
          label={t("logger.energy")}
          value={fields.kcal}
          onChange={set("kcal")}
        />
        <MealSlotField
          value={fields.mealSlot}
          onChange={(value) => onChange({ ...fields, mealSlot: value })}
        />
      </div>
      <div className="flex gap-2">
        <IntakeNumberField
          label={t("logger.protein")}
          value={fields.proteinG}
          onChange={set("proteinG")}
        />
        <IntakeNumberField
          label={t("logger.carbs")}
          value={fields.carbG}
          onChange={set("carbG")}
        />
        <IntakeNumberField
          label={t("logger.fat")}
          value={fields.fatG}
          onChange={set("fatG")}
        />
      </div>
      <label className="text-xs font-medium text-ink-body">
        {t("logger.labelOptional")}
        <input
          type="text"
          value={fields.label}
          aria-label={t("logger.label")}
          maxLength={120}
          onChange={(event) => set("label")(event.target.value)}
          className={LABEL_CLASS}
        />
      </label>
    </div>
  );
}
