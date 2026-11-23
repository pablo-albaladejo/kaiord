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
import { useUnsavedWork } from "../../../../lib/use-unsaved-work";
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
  const [header, setHeaderState] = useState<LabReportHeaderInput>(EMPTY_HEADER);
  const [rows, setRowsState] = useState<LabRowState[]>([
    createEmptyRow(nextRowId()),
  ]);
  const [provenance, setProvenance] = useState<LabProvenanceSource>("manual");
  // Anything typed, added or loaded stays unsaved until Save or reset.
  const [dirty, setDirty] = useState(false);
  useUnsavedWork(dirty);
  const setHeader = (next: LabReportHeaderInput) => {
    setDirty(true);
    setHeaderState(next);
  };
  const setRows = (next: (prev: LabRowState[]) => LabRowState[]) => {
    setDirty(true);
    setRowsState(next);
  };

  const reset = () => {
    setDirty(false);
    setHeaderState(EMPTY_HEADER);
    setRowsState([createEmptyRow(nextRowId())]);
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
    setRows(() => draft.rows.map((row) => ({ ...row, rowId: nextRowId() })));
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
