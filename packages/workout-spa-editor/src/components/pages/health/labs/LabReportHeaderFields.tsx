/**
 * LabReportHeaderFields — report-level fields: draw date (required), lab
 * name, and optional sample context (fasting / draw time / notes).
 */
import type { ReactNode } from "react";

import type { LabReportHeaderInput } from "../../../../application/lab/build-lab-report";

const FIELD_CLASS =
  "rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm">
    {label}
    {children}
  </label>
);

export type LabReportHeaderFieldsProps = {
  value: LabReportHeaderInput;
  onChange: (value: LabReportHeaderInput) => void;
};

type SetHeaderField = <K extends keyof LabReportHeaderInput>(
  key: K,
  next: LabReportHeaderInput[K]
) => void;

const FastingField = ({
  value,
  set,
}: {
  value: LabReportHeaderInput["fasting"];
  set: SetHeaderField;
}) => (
  <Field label="Fasting">
    <select
      value={value}
      className={FIELD_CLASS}
      onChange={(e) =>
        set("fasting", e.target.value as LabReportHeaderInput["fasting"])
      }
    >
      <option value="unspecified">Not specified</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  </Field>
);

export function LabReportHeaderFields({
  value,
  onChange,
}: LabReportHeaderFieldsProps) {
  const set: SetHeaderField = (key, next) =>
    onChange({ ...value, [key]: next });

  return (
    <fieldset
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      data-testid="lab-report-header"
    >
      <legend className="sr-only">Report details</legend>
      <Field label="Date">
        <input
          type="date"
          required
          value={value.date}
          className={FIELD_CLASS}
          onChange={(e) => set("date", e.target.value)}
        />
      </Field>
      <Field label="Lab">
        <input
          type="text"
          value={value.labName}
          className={FIELD_CLASS}
          onChange={(e) => set("labName", e.target.value)}
        />
      </Field>
      <FastingField value={value.fasting} set={set} />
      <Field label="Draw time">
        <input
          type="time"
          value={value.drawTime}
          className={FIELD_CLASS}
          onChange={(e) => set("drawTime", e.target.value)}
        />
      </Field>
      <div className="col-span-full">
        <Field label="Notes">
          <textarea
            value={value.notes}
            className={FIELD_CLASS}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </div>
    </fieldset>
  );
}
