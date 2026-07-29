/**
 * Value rendered on the Settings index "Connections" row: how many of the
 * known bridges are installed in this browser.
 *
 * It counts `discovered`, deliberately not `sessionActive`. A live-session
 * count cannot reach its own denominator — `tanita-bridge` has no session
 * prober, so it is permanently session-inactive and the counter would sit at
 * "4 of 5" forever, which reads as a defect rather than as a state.
 */

import { useBridgeConnections } from "../../../hooks/use-bridge-connections";
import { useTranslate } from "../../../i18n/use-translate";
import { countInstalled } from "./connection-attention";

export const useConnectionsValue = (): string | undefined => {
  const t = useTranslate("settings");
  // No profile is passed: the count reads `discovered` only, so the
  // per-profile sync timestamps this hook can join are not needed here.
  const connections = useBridgeConnections(null);

  if (connections.length === 0) return undefined;
  return t("values.connections.installed", {
    found: countInstalled(connections),
    total: connections.length,
  });
};
