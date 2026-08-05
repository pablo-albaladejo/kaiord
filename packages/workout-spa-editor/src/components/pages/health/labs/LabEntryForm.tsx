/**
 * LabEntryForm — DoD-1 form: report header + N parameter rows (add/remove),
 * saved as one `LabReport` + N `LabValue` via `useLabEntryForm`. Also hosts the
 * AI import affordance and, once a draft is loaded, a review banner.
 */
import { useTranslate } from "../../../../i18n/use-translate";
import { LabAiDraftBanner } from "./LabAiDraftBanner";
import { LabImportSection } from "./LabImportSection";
import { LabParameterRow } from "./LabParameterRow";
import { LabReportHeaderFields } from "./LabReportHeaderFields";
import { useLabEntryForm } from "./use-lab-entry-form";

export function LabEntryForm() {
  const t = useTranslate("labs-ui");
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
    loadDraft,
    discardDraft,
    isAiDraft,
  } = useLabEntryForm();

  return (
    <div className="flex flex-col gap-4" data-testid="lab-entry-form">
      <LabImportSection onDraft={loadDraft} />
      {isAiDraft && <LabAiDraftBanner onDiscard={discardDraft} />}
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
          className="rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-ink-body transition-colors hover:border-edge-strong hover:text-ink-strong"
        >
          {t("form.addParameter")}
        </button>
        <button
          type="button"
          disabled={isSaving || !header.date}
          onClick={save}
          className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {t("form.save")}
        </button>
      </div>
    </div>
  );
}
