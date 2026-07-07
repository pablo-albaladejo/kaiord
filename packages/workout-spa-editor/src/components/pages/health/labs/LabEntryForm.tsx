/**
 * LabEntryForm — DoD-1 form: report header + N parameter rows (add/remove),
 * saved as one `LabReport` + N `LabValue` via `useLabEntryForm`.
 */
import { LabParameterRow } from "./LabParameterRow";
import { LabReportHeaderFields } from "./LabReportHeaderFields";
import { useLabEntryForm } from "./use-lab-entry-form";

export function LabEntryForm() {
  const {
    header,
    setHeader,
    rows,
    addRow,
    removeRow,
    updateRow,
    save,
    isSaving,
    sex,
  } = useLabEntryForm();

  return (
    <div className="flex flex-col gap-4" data-testid="lab-entry-form">
      <LabReportHeaderFields value={header} onChange={setHeader} />
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <LabParameterRow
            key={row.rowId}
            row={row}
            sex={sex}
            onChange={(next) => updateRow(row.rowId, next)}
            onRemove={() => removeRow(row.rowId)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
        >
          Add parameter
        </button>
        <button
          type="button"
          disabled={isSaving || !header.date}
          onClick={save}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
