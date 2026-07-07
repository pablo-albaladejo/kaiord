/**
 * LabHistorySection — the F3 read surface under the entry form: the
 * latest-per-parameter list (F3.1/F3.3), the dated reports with review (DoD-3)
 * and a minimal delete (F3.4). Selection + deletion are owned here; the reads
 * are reactive so both update after any save or delete.
 */
import { useState } from "react";

import { deleteLabReport } from "../../../../application/lab/delete-lab-report.use-case";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { LabLatestValuesList } from "./LabLatestValuesList";
import { LabReportReview } from "./LabReportReview";
import { LabReportsList } from "./LabReportsList";
import {
  useLabParameterSummariesLive,
  useLabReportDetailLive,
  useLabReportsLive,
} from "./use-lab-history";

const LOADING = "Loading…";
const DELETED_MSG = "Lab report deleted";
const DELETE_FAILED_MSG = "Could not delete the lab report";

export const LabHistorySection = ({ profileId }: { profileId: string }) => {
  const persistence = usePersistence();
  const toast = useToastContext();
  const summaries = useLabParameterSummariesLive(profileId);
  const reports = useLabReportsLive(profileId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useLabReportDetailLive(selectedId);

  const toggle = (reportId: string) =>
    setSelectedId((prev) => (prev === reportId ? null : reportId));

  const remove = async (reportId: string) => {
    try {
      await deleteLabReport(persistence, reportId);
      setSelectedId((prev) => (prev === reportId ? null : prev));
      toast.success(DELETED_MSG);
    } catch {
      toast.error(DELETE_FAILED_MSG);
    }
  };

  return (
    <div data-testid="lab-history" className="mt-6 flex flex-col gap-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Latest values</h3>
        {summaries === undefined ? (
          <p className="text-sm text-gray-600">{LOADING}</p>
        ) : (
          <LabLatestValuesList summaries={summaries} />
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Reports</h3>
        {reports === undefined ? (
          <p className="text-sm text-gray-600">{LOADING}</p>
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
