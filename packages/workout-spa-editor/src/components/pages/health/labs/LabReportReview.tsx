/**
 * LabReportReview — a past report opened by date (DoD-3): its context header
 * plus every parameter with value, unit, range + origin, and flag.
 */
import type { LabReportDetail } from "../../../../application/lab/lab-queries";
import { useTranslate } from "../../../../i18n/use-translate";
import { LabReportValueRow } from "./LabReportValueRow";

export const LabReportReview = ({ detail }: { detail: LabReportDetail }) => {
  const t = useTranslate("labs-ui");
  const { report, values } = detail;
  return (
    <div
      data-testid="lab-report-review"
      data-report-id={report.id}
      className="mt-3 rounded-lg border border-gray-200 p-3 dark:border-slate-800"
    >
      <div className="mb-2 text-sm font-medium">
        {report.date}
        {report.labName ? ` · ${report.labName}` : ""}
        {report.fasting ? ` · ${t("report.fasting")}` : ""}
      </div>
      {values.length === 0 ? (
        <p className="text-sm text-gray-600">{t("report.emptyValues")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {values.map((value) => (
            <LabReportValueRow key={value.id} value={value} />
          ))}
        </ul>
      )}
    </div>
  );
};
