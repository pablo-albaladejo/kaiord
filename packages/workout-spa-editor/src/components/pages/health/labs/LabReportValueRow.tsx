/**
 * LabReportValueRow — one parameter inside the report review (DoD-3): value +
 * canonical unit, the effective reference range with its origin (report vs
 * catalog), and the out-of-range flag (F3.3).
 */
import type { LabValue } from "@kaiord/core";

import { isOutOfRange } from "./lab-flag-display";
import { labParameterLabel } from "./lab-parameter-label";
import { formatRefRange, refSourceLabel } from "./lab-ref-range-display";
import { LabFlagBadge } from "./LabFlagBadge";

export const LabReportValueRow = ({ value }: { value: LabValue }) => (
  <li
    data-testid="lab-review-value"
    data-parameter-key={value.parameterKey}
    data-flag={value.flag}
    className={`flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm ${
      isOutOfRange(value.flag)
        ? "border-red-300 dark:border-red-800"
        : "border-gray-200 dark:border-slate-800"
    }`}
  >
    <span className="min-w-0 flex-1 truncate">
      {labParameterLabel(value.parameterKey)}
    </span>
    <span className="whitespace-nowrap font-mono">
      {value.valueCanonical} {value.unitCanonical}
    </span>
    <span className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
      {formatRefRange(value)} · {refSourceLabel(value.refSource)}
    </span>
    <LabFlagBadge flag={value.flag} />
  </li>
);
