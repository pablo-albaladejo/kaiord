/**
 * useLabEntrySave — owns the save side-effect for the lab entry form: builds
 * the `{report, values}` submission (carrying the draft's provenance) and
 * commits it through `saveLabReport`, surfacing success/refusal via toasts.
 */
import { useState } from "react";

import type {
  LabProvenanceSource,
  LabReportHeaderInput,
} from "../../../../application/lab/build-lab-report";
import { buildLabReportSubmission } from "../../../../application/lab/build-lab-report-submission";
import type { LabValueRowInput } from "../../../../application/lab/build-lab-value";
import { saveLabReport } from "../../../../application/lab/save-lab-report.use-case";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";

const NO_VALUES_MSG = "Add at least one parameter value before saving";
const SAVE_FAILED_MSG = "Could not save the lab report — please retry";
const SAVED_MSG = "Lab report saved";

export function useLabEntrySave(onSaved: () => void) {
  const persistence = usePersistence();
  const toast = useToastContext();
  const active = useActiveProfileLive();
  const [isSaving, setIsSaving] = useState(false);

  const save = async (
    header: LabReportHeaderInput,
    rows: readonly LabValueRowInput[],
    provenance: LabProvenanceSource
  ) => {
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
      provenance,
    });
    if (!submission) {
      toast.error(NO_VALUES_MSG);
      return;
    }
    setIsSaving(true);
    try {
      await saveLabReport(persistence, submission.report, submission.values);
      toast.success(SAVED_MSG);
      onSaved();
    } catch {
      toast.error(SAVE_FAILED_MSG);
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving, sex: active?.profile?.sex };
}
