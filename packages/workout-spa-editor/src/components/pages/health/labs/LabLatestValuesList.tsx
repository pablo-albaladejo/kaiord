/**
 * LabLatestValuesList — the F3.1 latest-per-parameter list. Out-of-range rows
 * are highlighted at a glance (F3.3) by `LabParameterListItem`.
 *
 * `selectedKeys` (F5) supports the dashboard's multi-pin picker: when
 * provided it takes over row highlighting from the single-select
 * `selectedKey`, so the same list doubles as the dashboard's parameter
 * picker without changing the F3 single-select detail view.
 */
import type { LabParameterSummary } from "./build-lab-parameter-summaries";
import { LabParameterListItem } from "./LabParameterListItem";

const EMPTY_MSG = "No lab parameters recorded yet.";

export const LabLatestValuesList = ({
  summaries,
  onSelect,
  selectedKey,
  selectedKeys,
}: {
  summaries: LabParameterSummary[];
  onSelect?: (parameterKey: string) => void;
  selectedKey?: string | null;
  selectedKeys?: ReadonlySet<string>;
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
          selected={
            selectedKeys
              ? selectedKeys.has(summary.parameterKey)
              : summary.parameterKey === selectedKey
          }
        />
      ))}
    </ul>
  );
};
