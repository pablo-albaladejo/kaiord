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

/* Raised rather than tinted. Success and warning hues are not in the palette,
   so the card that needs the reader separates itself by elevation and by the
   marked status line inside it — the same pair the banner above uses. */
const SETTLED = "border-edge-soft bg-surface";
const ATTENTION = "border-edge bg-surface-elevated";

export function ConnectionSourceCard({ source, profileId, byDataType }: Props) {
  const [open, setOpen] = useState(false);
  const manageable = canDisconnect(source);
  const apiKeyConnect =
    source.mechanism === "api-key" && source.status !== "connected";
  const surface = source.status === "attention" ? ATTENTION : SETTLED;

  return (
    <div
      data-testid={`connection-card-${source.id}`}
      data-status={source.status}
      className={`space-y-3 rounded-2xl border p-4 ${surface}`}
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
