/**
 * How many of the athlete's sources are connected, counted over the same
 * list the Connections cards are rendered from — extensions, API-key sources
 * and all — so the count cannot disagree with the cards beneath it.
 *
 * Gated on discovery having had its window: until an extension announces,
 * every bridge reads "available", and a reader with five extensions installed
 * would be told "None connected" for seconds after a reload.
 */

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { sourceIsConnected } from "../../../application/connections/connection-source";
import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";
import { useTranslate } from "../../../i18n/use-translate";

export const useConnectionsValue = (
  sources: readonly ConnectionSource[]
): string | undefined => {
  const t = useTranslate("connections");
  const count = sources.filter(sourceIsConnected).length;
  const settled = useDiscoverySettled(count);

  if (!settled) return undefined;
  if (count === 0) return t("count.none");
  return t(count === 1 ? "count.connected_one" : "count.connected_other", {
    count,
  });
};
