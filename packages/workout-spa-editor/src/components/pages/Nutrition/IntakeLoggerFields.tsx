import type { IntakeLoggerFields as Fields } from "./intake-logger-model";
import { IntakeNumberField } from "./IntakeNumberField";
import { MealSlotField } from "./MealSlotField";

const LABEL_CLASS =
  "mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100";

export type IntakeLoggerFieldsProps = {
  fields: Fields;
  onChange: (next: Fields) => void;
};

/** The grouped input controls for the intake logger; parent owns state. */
export function IntakeLoggerFields({
  fields,
  onChange,
}: IntakeLoggerFieldsProps) {
  const set = (key: keyof Fields) => (value: string) =>
    onChange({ ...fields, [key]: value });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <IntakeNumberField
          label="Energy (kcal)"
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
          label="Protein (g)"
          value={fields.proteinG}
          onChange={set("proteinG")}
        />
        <IntakeNumberField
          label="Carbs (g)"
          value={fields.carbG}
          onChange={set("carbG")}
        />
        <IntakeNumberField
          label="Fat (g)"
          value={fields.fatG}
          onChange={set("fatG")}
        />
      </div>
      <label className="text-xs font-medium text-slate-300">
        Label (optional)
        <input
          type="text"
          value={fields.label}
          aria-label="Label"
          maxLength={120}
          onChange={(event) => set("label")(event.target.value)}
          className={LABEL_CLASS}
        />
      </label>
    </div>
  );
}
