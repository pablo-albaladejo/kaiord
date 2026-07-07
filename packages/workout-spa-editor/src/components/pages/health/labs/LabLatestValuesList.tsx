/**
 * LabLatestValuesList — the F3.1 latest-per-parameter list. Out-of-range rows
 * are highlighted at a glance (F3.3) by `LabParameterListItem`.
 */
import type { LabParameterSummary } from "./build-lab-parameter-summaries";
import { LabParameterListItem } from "./LabParameterListItem";

const EMPTY_MSG = "No lab parameters recorded yet.";

export const LabLatestValuesList = ({
  summaries,
  onSelect,
  selectedKey,
}: {
  summaries: LabParameterSummary[];
  onSelect?: (parameterKey: string) => void;
  selectedKey?: string | null;
}) => {
  if (summaries.length === 0)
    return <p className="text-sm text-gray-600">{EMPTY_MSG}</p>;
  return (
    <ul data-testid="lab-latest-values" className="flex flex-col gap-2">
      {summaries.map((summary) => (
        <LabParameterListItem
          key={summary.parameterKey}
          summary={summary}
          onSelect={onSelect}
          selected={summary.parameterKey === selectedKey}
        />
      ))}
    </ul>
  );
};
