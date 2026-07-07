/**
 * useLabEntryForm — owns the DoD-1 entry form's ephemeral state (report
 * header + N parameter rows) and saves it as one `LabReport` + N `LabValue`
 * via `saveLabReport`. A report with zero usable rows is refused (nothing
 * to save) — see `buildLabReportSubmission`.
 */
import { useState } from "react";

import type { LabReportHeaderInput } from "../../../../application/lab/build-lab-report";
import { buildLabReportSubmission } from "../../../../application/lab/build-lab-report-submission";
import { saveLabReport } from "../../../../application/lab/save-lab-report.use-case";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { createEmptyRow, type LabRowState } from "./lab-row-model";

const NO_VALUES_MSG = "Add at least one parameter value before saving";
const SAVE_FAILED_MSG = "Could not save the lab report — please retry";
const SAVED_MSG = "Lab report saved";

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
  const persistence = usePersistence();
  const toast = useToastContext();
  const active = useActiveProfileLive();
  const [header, setHeader] = useState<LabReportHeaderInput>(EMPTY_HEADER);
  const [rows, setRows] = useState<LabRowState[]>([
    createEmptyRow(nextRowId()),
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addRow = () =>
    setRows((prev) => [...prev, createEmptyRow(nextRowId())]);
  const removeRow = (rowId: string) =>
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  const updateRow = (rowId: string, next: LabRowState) =>
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? next : r)));

  const save = async () => {
    const profileId = active?.id;
    if (!profileId) {
      toast.error(SAVE_FAILED_MSG);
      return;
    }
    const submission = buildLabReportSubmission(header, rows, {
      profileId,
      reportId: crypto.randomUUID(),
      sex: active?.profile?.sex,
      newId: () => crypto.randomUUID(),
    });
    if (!submission) {
      toast.error(NO_VALUES_MSG);
      return;
    }
    setIsSaving(true);
    try {
      await saveLabReport(persistence, submission.report, submission.values);
      toast.success(SAVED_MSG);
      setHeader(EMPTY_HEADER);
      setRows([createEmptyRow(nextRowId())]);
    } catch {
      toast.error(SAVE_FAILED_MSG);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    header,
    setHeader,
    rows,
    addRow,
    removeRow,
    updateRow,
    save,
    isSaving,
    sex: active?.profile?.sex,
  };
}
