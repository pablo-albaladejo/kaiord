/**
 * LabParameterListItem — one row of the F3.1 latest-per-parameter list:
 * label, sparkline of the parameter's history, latest canonical value, and
 * the out-of-range flag (F3.3). Out-of-range emphasis is a lightness step on
 * the border, not a hue — the flag itself carries the glyph and the word.
 */
import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { Sparkline } from "../../../charts/uplot-base/Sparkline";
import type { LabParameterSummary } from "./build-lab-parameter-summaries";
import { isOutOfRange } from "./lab-flag-display";
import { labParameterLabel } from "./lab-parameter-label";
import { LabFlagBadge } from "./LabFlagBadge";

export type LabParameterListItemProps = {
  summary: LabParameterSummary;
  onSelect?: (parameterKey: string) => void;
  selected?: boolean;
};

export const LabParameterListItem = ({
  summary,
  onSelect,
  selected = false,
}: LabParameterListItemProps) => {
  const { latest, points } = summary;
  const outOfRange = isOutOfRange(latest.flag);
  const label = labParameterLabel(summary.parameterKey, useActiveLocale());
  return (
    <li
      data-testid="lab-parameter-item"
      data-parameter-key={summary.parameterKey}
      data-flag={latest.flag}
      className={`flex items-center justify-between gap-3 rounded-xl border bg-surface p-2 text-sm text-ink-body ${
        selected ? "ring-2 ring-accent " : ""
      }${outOfRange ? "border-edge-strong" : "border-edge-soft"}`}
    >
      {onSelect ? (
        <button
          type="button"
          data-testid="lab-parameter-select"
          aria-pressed={selected}
          onClick={() => onSelect(summary.parameterKey)}
          className="min-w-0 flex-1 truncate text-left hover:underline"
        >
          {label}
        </button>
      ) : (
        <span className="min-w-0 flex-1 truncate">{label}</span>
      )}
      <Sparkline points={points} />
      <span className="whitespace-nowrap font-medium tabular-nums slashed-zero text-ink-strong">
        {latest.valueCanonical} {latest.unitCanonical}
      </span>
      <LabFlagBadge flag={latest.flag} />
    </li>
  );
};
