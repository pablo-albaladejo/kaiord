import { useState } from "react";

import { Icon, ICON_MAP } from "../../atoms/Icon";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import type { ConnectionConfig } from "./connection-config";
import { ConnectionFlows } from "./ConnectionFlows";
import { ConnectionMark } from "./ConnectionMark";
import { bridgePolicies } from "./data-flow-lookup";
import { usePolicyToggle } from "./use-policy-toggle";

type ConnectedRowProps = {
  profileId: string;
  config: ConnectionConfig;
  bridgeId: string;
  byDataType: DataFlowsByType;
  expanded: boolean;
  onToggleExpanded: () => void;
};

/* Bridge-level connect/disconnect semantics are provisional: "Disconnect"
   here simply disables every policy on the bridge. Real account unlinking is
   not yet supported. */
export function ConnectedRow(props: ConnectedRowProps) {
  const { profileId, config, bridgeId, byDataType, expanded } = props;
  const [confirming, setConfirming] = useState(false);
  const { toggleFlow, disableBridge } = usePolicyToggle();

  const onToggleFlow = (flowIndex: number, next: boolean) => {
    const flow = config.flows[flowIndex];
    if (!flow) return;
    void toggleFlow({ profileId, bridgeId, ...flow, next });
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-surface p-3">
      <button
        type="button"
        onClick={props.onToggleExpanded}
        className="flex w-full items-center gap-3 text-left"
      >
        <ConnectionMark mark={config.mark} />
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-slate-50">
            {config.name}
          </div>
          <div className="text-[12.5px] text-emerald-400">Connected</div>
        </div>
        <Icon
          icon={ICON_MAP[expanded ? "chevD" : "chevR"]}
          size="sm"
          color="muted"
          strokeWidth={2}
        />
      </button>
      {expanded && (
        <ConnectionFlows
          config={config}
          bridgeId={bridgeId}
          byDataType={byDataType}
          onToggleFlow={onToggleFlow}
          onDisconnect={() => setConfirming(true)}
        />
      )}
      <ConfirmationModal
        isOpen={confirming}
        title="Disconnect"
        message="This disables every sync for this connection. You can re-enable them later."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        variant="destructive"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          void disableBridge(bridgePolicies(byDataType, bridgeId));
          setConfirming(false);
        }}
      />
    </div>
  );
}
