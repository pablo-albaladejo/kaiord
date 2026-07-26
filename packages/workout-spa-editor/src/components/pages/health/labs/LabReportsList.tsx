/**
 * LabReportsList — dated reports (DoD-3 entry points) with per-row delete
 * (F3.4). Selection and deletion are owned by the parent section.
 */
import type { LabReport } from "@kaiord/core";

import { useTranslate } from "../../../../i18n/use-translate";
import { LabReportRow } from "./LabReportRow";

export type LabReportsListProps = {
  reports: LabReport[];
  selectedId: string | null;
  onToggle: (reportId: string) => void;
  onDelete: (reportId: string) => void;
};

export const LabReportsList = ({
  reports,
  selectedId,
  onToggle,
  onDelete,
}: LabReportsListProps) => {
  const t = useTranslate("labs-ui");
  if (reports.length === 0)
    return <p className="text-sm text-gray-600">{t("report.emptyList")}</p>;
  return (
    <ul data-testid="lab-reports-list" className="flex flex-col gap-2">
      {reports.map((report) => (
        <LabReportRow
          key={report.id}
          report={report}
          isSelected={report.id === selectedId}
          onToggle={() => onToggle(report.id)}
          onDelete={() => onDelete(report.id)}
        />
      ))}
    </ul>
  );
};
