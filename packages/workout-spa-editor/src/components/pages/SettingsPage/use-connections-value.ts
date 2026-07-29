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
import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";
import { useBridgeConnections } from "../../../hooks/use-bridge-connections";
import { useTranslate } from "../../../i18n/use-translate";

export const useConnectionsValue = (): string | undefined => {
  const t = useTranslate("settings");
  // No profile is passed: the count reads `discovered` only, so the
  // per-profile sync timestamps this hook can join are not needed here.
  const connections = useBridgeConnections(null);
  const found = countDetected(connections);
  // Gated on discovery having had its window, NOT on the store having
  // completed a pass: that pass finishes microseconds after boot with every
  // row undiscovered, because nothing has announced yet and nothing asked it
  // to. Waiting on it rendered "0 of 5" to a fully equipped reader. The
  // Connections section counts the same thing behind the same gate, so the
  // row and the section it leads to cannot disagree while both are settling.
  const settled = useDiscoverySettled(found);

  if (!settled) return undefined;
  return t("values.connections.detected", {
    found,
    total: connections.length,
  });
};
