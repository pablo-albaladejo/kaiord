/**
 * LabParameterListItem — one row of the F3.1 latest-per-parameter list:
 * label, sparkline of the parameter's history, latest canonical value, and
 * the out-of-range flag (F3.3, highlighted border when low/high).
 */
import { Sparkline } from "../../../charts/uplot-base/Sparkline";
import type { LabParameterSummary } from "./build-lab-parameter-summaries";
import { isOutOfRange } from "./lab-flag-display";
import { labParameterLabel } from "./lab-parameter-label";
import { LabFlagBadge } from "./LabFlagBadge";

export const LabParameterListItem = ({
  summary,
}: {
  summary: LabParameterSummary;
}) => {
  const { latest, points } = summary;
  const outOfRange = isOutOfRange(latest.flag);
  return (
    <li
      data-testid="lab-parameter-item"
      data-parameter-key={summary.parameterKey}
      data-flag={latest.flag}
      className={`flex items-center justify-between gap-3 rounded border p-2 text-sm ${
        outOfRange
          ? "border-red-300 dark:border-red-800"
          : "border-gray-200 dark:border-slate-800"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">
        {labParameterLabel(summary.parameterKey)}
      </span>
      <Sparkline points={points} />
      <span className="whitespace-nowrap font-mono">
        {latest.valueCanonical} {latest.unitCanonical}
      </span>
      <LabFlagBadge flag={latest.flag} />
    </li>
  );
};
