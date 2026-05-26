/**
 * DataFlowsSubsection — Sources or Destinations list within a DataFlowsGroup.
 */
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { IntegrationPolicy } from "../../../../types/integration-policy";
import { DataFlowsRow } from "./DataFlowsRow";

type Props = {
  label: string;
  rows: IntegrationPolicy[];
  allBridges: readonly DiscoveredBridge[];
  emptyText: string;
  onAdd: () => void;
  addLabel: string;
};

export function DataFlowsSubsection({
  label,
  rows,
  allBridges,
  emptyText,
  onAdd,
  addLabel,
}: Props) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {rows.map((p) => (
            <DataFlowsRow key={p.id} policy={p} allBridges={allBridges} />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 text-xs text-blue-600 hover:underline"
      >
        {addLabel}
      </button>
    </div>
  );
}
