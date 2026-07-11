import { useId } from "react";

const FIELD_CLASS =
  "mt-1 block w-full rounded border border-edge bg-surface-deep px-2 py-1.5 text-sm text-ink-strong";

export type IntakeNumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** One labeled non-negative number input for the intake logger. */
export function IntakeNumberField({
  label,
  value,
  onChange,
}: IntakeNumberFieldProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex-1 text-xs font-medium text-ink-body">
      {label}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
    </label>
  );
}
