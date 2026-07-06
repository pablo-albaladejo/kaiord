import { useState } from "react";

import { useBridgeCapabilities } from "../../../hooks/use-bridge-capabilities";
import { useConnectionActions } from "../../../hooks/use-connection-actions";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import type { ConnectionConfig } from "./connection-config";
import { ConnectionFlows } from "./ConnectionFlows";
import { ConnectionMark } from "./ConnectionMark";
import { bridgePolicies } from "./data-flow-lookup";
import { DisconnectConfirmation } from "./DisconnectConfirmation";
import { deriveConnectionFlows } from "./flow-availability";
import { usePolicyToggle } from "./use-policy-toggle";

type ConnectedRowProps = {
  profileId: string;
  config: ConnectionConfig;
  bridgeId: string;
  byDataType: DataFlowsByType;
  expanded: boolean;
  onToggleExpanded: () => void;
};

/* Disconnect is a real account-unlink: it clears the bridge connection record
   and disables every flow policy on the bridge (#714). */
export function ConnectedRow(props: ConnectedRowProps) {
  const { profileId, config, bridgeId, byDataType, expanded } = props;
  const [confirming, setConfirming] = useState(false);
  const { toggleFlow } = usePolicyToggle();
  const { disconnect } = useConnectionActions(profileId);
  const capabilities = useBridgeCapabilities(bridgeId);
  const flows = deriveConnectionFlows(capabilities);

  const onToggleFlow = (flowIndex: number, next: boolean) => {
    const flow = flows[flowIndex];
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
          bridgeId={bridgeId}
          byDataType={byDataType}
          capabilities={capabilities}
          onToggleFlow={onToggleFlow}
          onDisconnect={() => setConfirming(true)}
        />
      )}
      <DisconnectConfirmation
        isOpen={confirming}
        message="This disables every sync for this connection. You can re-enable them later."
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          void disconnect(
            config.id,
            "bridge",
            bridgePolicies(byDataType, bridgeId)
          );
          setConfirming(false);
        }}
      />
    </div>
  );
}
