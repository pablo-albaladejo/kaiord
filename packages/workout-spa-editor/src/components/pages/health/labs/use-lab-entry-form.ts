/**
 * useLabEntryForm — owns the entry form's ephemeral state (header + rows) and
 * its provenance (manual entry vs an AI-extracted draft). Saving and reset
 * delegate to `useLabEntrySave`; `loadDraft` pre-fills the form from an
 * extraction and marks it as an AI draft for the review banner.
 */
import { useState } from "react";

import type {
  LabProvenanceSource,
  LabReportHeaderInput,
} from "../../../../application/lab/build-lab-report";
import { createEmptyRow, type LabRowState } from "./lab-row-model";
import type { LabDraft } from "./map-extraction-to-draft";
import { useLabEntrySave } from "./use-lab-entry-save";

const EMPTY_HEADER: LabReportHeaderInput = {
  date: "",
  labName: "",
  fasting: "unspecified",
  drawTime: "",
  notes: "",
};

let rowSeq = 0;
const nextRowId = (): string => `row-${++rowSeq}`;

export function useLabEntryForm() {
  const [header, setHeader] = useState<LabReportHeaderInput>(EMPTY_HEADER);
  const [rows, setRows] = useState<LabRowState[]>([
    createEmptyRow(nextRowId()),
  ]);
  const [provenance, setProvenance] = useState<LabProvenanceSource>("manual");

  const reset = () => {
    setHeader(EMPTY_HEADER);
    setRows([createEmptyRow(nextRowId())]);
    setProvenance("manual");
  };
  const { save, isSaving, sex } = useLabEntrySave(reset);

  const addRow = () =>
    setRows((prev) => [...prev, createEmptyRow(nextRowId())]);
  const removeRow = (rowId: string) =>
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  const updateRow = (rowId: string, next: LabRowState) =>
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? next : r)));

  const loadDraft = (draft: LabDraft) => {
    setHeader(draft.header);
    setRows(draft.rows.map((row) => ({ ...row, rowId: nextRowId() })));
    setProvenance("ai-extracted");
  };

  return {
    header,
    setHeader,
    rows,
    addRow,
    removeRow,
    updateRow,
    save: () => save(header, rows, provenance),
    isSaving,
    sex,
    loadDraft,
    discardDraft: reset,
    isAiDraft: provenance === "ai-extracted",
  };
}
