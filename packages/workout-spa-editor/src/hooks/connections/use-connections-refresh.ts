/**
 * useConnectionsRefresh — the Connections section's "Refresh all".
 *
 * One forced pass over every known bridge. It genuinely replaces the old
 * partial control, which only re-detected garmin and train2go:
 * `refreshConnections` fans out over `KNOWN_BRIDGE_IDS` with
 * `Promise.allSettled`, so one unreachable extension cannot abort the rest.
 *
 * Both guards live in `refresh-cooldown`, not in this hook's state — the
 * button is inside a section the user can leave and return to, and hook state
 * dies with it while the extensions it protects do not. Reading the in-flight
 * flag synchronously also settles the two-fast-clicks case that a captured
 * `status` could not.
 */
import { useCallback, useEffect, useState } from "react";

import { bridgeConnections } from "../../adapters/bridge/bridge-connection-store";
import {
  isRefreshCoolingDown,
  isRefreshRunning,
  refreshCooldownRemaining,
  startOrJoinRefresh,
} from "./refresh-cooldown";

export type ConnectionsRefreshStatus = "idle" | "running" | "cooldown";

export type ConnectionsRefresh = {
  readonly status: ConnectionsRefreshStatus;
  readonly run: () => void;
};

export const useConnectionsRefresh = (): ConnectionsRefresh => {
  const [status, setStatus] = useState<ConnectionsRefreshStatus>("idle");

  const run = useCallback(() => {
    if (!isRefreshRunning() && isRefreshCoolingDown(Date.now())) {
      setStatus("cooldown");
      return;
    }
    setStatus("running");
    void startOrJoinRefresh(() =>
      bridgeConnections.refresh({ force: true })
    ).then(
      () => setStatus("idle"),
      () => setStatus("idle")
    );
  }, []);

  // "Try again in a minute" has to stop being displayed when the minute is
  // up, or it outlives the refusal it describes and reads as a dead control.
  useEffect(() => {
    if (status !== "cooldown") return;
    const timer = setTimeout(
      () => setStatus("idle"),
      refreshCooldownRemaining(Date.now())
    );
    return () => clearTimeout(timer);
  }, [status]);

  return { status, run };
};
