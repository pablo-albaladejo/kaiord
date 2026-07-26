/**
 * LabHistorySection — the F3 read surface under the entry form: the
 * latest-per-parameter list with its evolution chart (F3.1/F3.3/DoD-2) and the
 * dated reports with review (DoD-3) plus a minimal delete (F3.4). The reads are
 * reactive so every section updates after any save or delete.
 */
import { useState } from "react";

import { deleteLabReport } from "../../../../application/lab/delete-lab-report.use-case";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useTranslate } from "../../../../i18n/use-translate";
import { LabLatestValuesSection } from "./LabLatestValuesSection";
import { LabReportReview } from "./LabReportReview";
import { LabReportsList } from "./LabReportsList";
import { useLabReportDetailLive, useLabReportsLive } from "./use-lab-history";

export const LabHistorySection = ({ profileId }: { profileId: string }) => {
  const t = useTranslate("labs-ui");
  const persistence = usePersistence();
  const toast = useToastContext();
  const reports = useLabReportsLive(profileId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useLabReportDetailLive(selectedId);

  const toggle = (reportId: string) =>
    setSelectedId((prev) => (prev === reportId ? null : reportId));

  const remove = async (reportId: string) => {
    try {
      await deleteLabReport(persistence, reportId);
      setSelectedId((prev) => (prev === reportId ? null : prev));
      toast.success(t("history.deleted"));
    } catch {
      toast.error(t("history.deleteFailed"));
    }
  };

  return (
    <div data-testid="lab-history" className="mt-6 flex flex-col gap-6">
      <LabLatestValuesSection profileId={profileId} />
      <section>
        <h3 className="mb-2 text-sm font-semibold">{t("history.reports")}</h3>
        {reports === undefined ? (
          <p className="text-sm text-gray-600">{t("history.loading")}</p>
        ) : (
          <LabReportsList
            reports={reports}
            selectedId={selectedId}
            onToggle={toggle}
            onDelete={remove}
          />
        )}
        {detail && <LabReportReview detail={detail} />}
      </section>
    </div>
  );
};
