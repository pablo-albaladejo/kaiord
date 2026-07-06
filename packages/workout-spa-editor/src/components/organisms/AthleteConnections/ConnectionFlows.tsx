import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { isFlowEnabled } from "./data-flow-lookup";
import { deriveConnectionFlows, flowAvailability } from "./flow-availability";
import { FlowRow } from "./FlowRow";

type ConnectionFlowsProps = {
  bridgeId: string;
  byDataType: DataFlowsByType;
  capabilities: readonly string[];
  onToggleFlow: (flowIndex: number, next: boolean) => void;
  onDisconnect: () => void;
};

export function ConnectionFlows({
  bridgeId,
  byDataType,
  capabilities,
  onToggleFlow,
  onDisconnect,
}: ConnectionFlowsProps) {
  const flows = deriveConnectionFlows(capabilities);
  return (
    <div className="mt-1 border-t border-slate-800 pt-1">
      <div className="px-1 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        What syncs
      </div>
      {flows.map((flow, index) => (
        <FlowRow
          key={`${flow.dataType}-${flow.direction}`}
          flow={flow}
          availability={flowAvailability(flow, capabilities)}
          checked={isFlowEnabled(byDataType, flow, bridgeId)}
          onToggle={(next) => onToggleFlow(index, next)}
        />
      ))}
      <button
        type="button"
        onClick={onDisconnect}
        className="mt-1 text-[13px] font-semibold text-red-400"
      >
        Disconnect
      </button>
    </div>
  );
}
