import { useState } from "react";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { canDisconnect } from "./connection-card-copy";
import { ConnectionApiKeyPanel } from "./ConnectionApiKeyPanel";
import { ConnectionBridgeLine } from "./ConnectionBridgeLine";
import { ConnectionCardAction } from "./ConnectionCardAction";
import { ConnectionCardHeader } from "./ConnectionCardHeader";
import { ConnectionManagePanel } from "./ConnectionManagePanel";
import { ConnectionRouteChips } from "./ConnectionRouteChips";

type Props = {
  source: ConnectionSource;
  profileId: string;
  byDataType: DataFlowsByType;
};

/* A ring rather than a border tint: `border-edge` and an amber border are the
   same property at the same specificity, so which one wins would depend on
   stylesheet order rather than on intent. */
const ATTENTION_RING = "ring-1 ring-amber-500/40";

export function ConnectionSourceCard({ source, profileId, byDataType }: Props) {
  const [open, setOpen] = useState(false);
  const manageable = canDisconnect(source);
  const apiKeyConnect =
    source.mechanism === "api-key" && source.status !== "connected";
  const ring = source.status === "attention" ? ATTENTION_RING : "";

  return (
    <div
      data-testid={`connection-card-${source.id}`}
      data-status={source.status}
      className={`space-y-3 rounded-2xl border border-edge bg-surface p-4 ${ring}`}
    >
      <ConnectionCardHeader
        source={source}
        action={
          <ConnectionCardAction
            source={source}
            profileId={profileId}
            open={open}
            onToggle={() => setOpen((value) => !value)}
          />
        }
      />
      <ConnectionBridgeLine source={source} />
      <ConnectionRouteChips source={source} />
      {open && manageable && (
        <ConnectionManagePanel
          source={source}
          profileId={profileId}
          byDataType={byDataType}
        />
      )}
      {open && apiKeyConnect && (
        <ConnectionApiKeyPanel
          source={source}
          profileId={profileId}
          onDone={() => setOpen(false)}
        />
      )}
    </div>
  );
}
