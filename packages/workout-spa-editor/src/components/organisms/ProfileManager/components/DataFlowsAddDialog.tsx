import type { ManagedDataType } from "@kaiord/core";

import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { IntegrationPolicyDirection } from "../../../../types/integration-policy";
import { DataFlowsAddFields } from "./DataFlowsAddFields";
import { useDataFlowsAdd } from "./useDataFlowsAdd";

export type Props = {
  profileId: string;
  dataType: ManagedDataType;
  direction: IntegrationPolicyDirection;
  discoveredBridges: readonly DiscoveredBridge[];
  onClose: () => void;
};

export function DataFlowsAddDialog(props: Props) {
  const {
    eligible,
    bridgeId,
    setBridgeId,
    mode,
    setMode,
    enabled,
    setEnabled,
    isDiscovered,
    handleAdd,
  } = useDataFlowsAdd(props);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add ${props.direction}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold">
          Add {props.direction === "import" ? "source" : "destination"}
        </h3>
        <DataFlowsAddFields
          eligible={eligible}
          discoveredBridges={props.discoveredBridges}
          bridgeId={bridgeId}
          setBridgeId={setBridgeId}
          mode={mode}
          setMode={setMode}
          enabled={enabled}
          setEnabled={setEnabled}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded border px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!bridgeId || !isDiscovered}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
