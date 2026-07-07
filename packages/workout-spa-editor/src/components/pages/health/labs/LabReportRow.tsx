/**
 * LabReportRow — one entry in the reports list: a toggle that opens the review
 * (DoD-3) and a two-step inline delete confirmation (F3.4, no edit in V1).
 */
import type { LabReport } from "@kaiord/core";
import { useState } from "react";

const BTN = "rounded border px-2 py-1 text-xs";

export type LabReportRowProps = {
  report: LabReport;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export const LabReportRow = ({
  report,
  isSelected,
  onToggle,
  onDelete,
}: LabReportRowProps) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <li
      data-testid="lab-report-row"
      data-report-id={report.id}
      className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
    >
      <button type="button" onClick={onToggle} className="flex-1 text-left">
        <span className="font-medium">{report.date}</span>
        {report.labName ? ` · ${report.labName}` : ""}
        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
          {isSelected ? "Hide" : "View"}
        </span>
      </button>
      {confirming ? (
        <span className="flex gap-1">
          <button
            type="button"
            onClick={onDelete}
            className={`${BTN} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={`${BTN} border-gray-300 dark:border-gray-600`}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          aria-label={`Delete report ${report.date}`}
          onClick={() => setConfirming(true)}
          className={`${BTN} border-gray-300 dark:border-gray-600`}
        >
          Delete
        </button>
      )}
    </li>
  );
};
