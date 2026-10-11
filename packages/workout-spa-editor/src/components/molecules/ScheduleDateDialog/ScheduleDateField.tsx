import { useTranslate } from "../../../i18n/use-translate";

export type ScheduleDateFieldProps = {
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
};

const INPUT_ID = "schedule-date-input";
const ERROR_ID = "schedule-date-error";

export function ScheduleDateField({
  value,
  invalid,
  onChange,
}: ScheduleDateFieldProps) {
  const t = useTranslate("library");
  return (
    <>
      <label htmlFor={INPUT_ID} className="sr-only">
        {t("scheduleDialog.dateLabel")}
      </label>
      <input
        id={INPUT_ID}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? ERROR_ID : undefined}
        className="w-full rounded border px-3 py-2 mb-4 dark:bg-gray-700 dark:border-gray-600"
        data-testid="schedule-date-input"
      />
      {invalid && (
        <p id={ERROR_ID} role="alert" className="mb-4 text-sm text-danger-text">
          {t("scheduleDialog.invalidDate")}
        </p>
      )}
    </>
  );
}
