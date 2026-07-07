import { useState } from "react";
import { useLocation } from "wouter";

import { useConnectionActions } from "../../../hooks/use-connection-actions";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import type { ConnectionConfig } from "./connection-config";
import { ConnectionMark } from "./ConnectionMark";
import { bridgePolicies } from "./data-flow-lookup";
import { DisconnectConfirmation } from "./DisconnectConfirmation";

type ConnectedRowProps = {
  profileId: string;
  config: ConnectionConfig;
  bridgeId: string;
  byDataType: DataFlowsByType;
};

/* Disconnect is a real account-unlink: it clears the bridge connection record
   and disables every flow policy on the bridge (#714). Per-flow routing
   toggles used to live here ("What syncs"); they now live exclusively in the
   Data Hub matrix (F4.2) — this card only surfaces connection state and a
   link there, plus disconnect. */
export function ConnectedRow(props: ConnectedRowProps) {
  const { profileId, config, bridgeId, byDataType } = props;
  const [confirming, setConfirming] = useState(false);
  const { disconnect } = useConnectionActions(profileId);
  const [, navigate] = useLocation();

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-surface p-3">
      <div className="flex items-center gap-3">
        <ConnectionMark mark={config.mark} />
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-slate-50">
            {config.name}
          </div>
          <div className="text-[12.5px] text-emerald-400">Connected</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
        <button
          type="button"
          onClick={() => navigate("/settings/data-hub")}
          className="flex items-center gap-1 text-[13px] font-semibold text-sky-400"
        >
          <Icon
            icon={ICON_MAP.route}
            size="sm"
            color="inherit"
            strokeWidth={2}
          />
          Data routing
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-[13px] font-semibold text-red-400"
        >
          Disconnect
        </button>
      </div>
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
