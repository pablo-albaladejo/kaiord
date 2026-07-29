/**
 * Value rendered on the Settings index "Connections" row: how many of the
 * known bridges are currently answering in this browser.
 *
 * It counts `discovered`, deliberately not `sessionActive`. A live-session
 * count cannot reach its own denominator — `tanita-bridge` has no session
 * prober, so it is permanently session-inactive and the counter would sit at
 * "4 of 5" forever, which reads as a defect rather than as a state.
 *
 * "Detected" is the honest word for what `discovered` holds: a page cannot
 * enumerate installed extensions, only the ones that announced themselves and
 * answered a ping this page-life.
 */

import { countDetected } from "../../../application/connections/source-attention";
import {
  useBridgeConnections,
  useBridgeConnectionsRefreshed,
} from "../../../hooks/use-bridge-connections";
import { useTranslate } from "../../../i18n/use-translate";

export const useConnectionsValue = (): string | undefined => {
  const t = useTranslate("settings");
  // No profile is passed: the count reads `discovered` only, so the
  // per-profile sync timestamps this hook can join are not needed here.
  const connections = useBridgeConnections(null);
  const refreshed = useBridgeConnectionsRefreshed();

  // Every row exists from the first render and reads undiscovered, so a value
  // rendered before the first pass completes would tell a fully equipped user
  // "0 of 5" for as long as discovery takes.
  if (!refreshed || connections.length === 0) return undefined;
  return t("values.connections.detected", {
    found: countDetected(connections),
    total: connections.length,
  });
};
