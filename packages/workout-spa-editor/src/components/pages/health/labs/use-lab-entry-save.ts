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
import { useTranslate } from "../../../../i18n/use-translate";

export function useLabEntrySave(onSaved: () => void) {
  const t = useTranslate("labs-ui");
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
      toast.error(t("entry.saveFailed"));
      return;
    }
    setIsSaving(true);
    try {
      const submission = buildLabReportSubmission(header, rows, {
        profileId,
        reportId: crypto.randomUUID(),
        sex: active?.profile?.sex,
        newId: () => crypto.randomUUID(),
        provenance,
      });
      if (!submission) {
        toast.error(t("entry.noValues"));
        return;
      }
      await saveLabReport(persistence, submission.report, submission.values);
      toast.success(t("entry.saved"));
      onSaved();
    } catch {
      toast.error(t("entry.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving, sex: active?.profile?.sex };
}
