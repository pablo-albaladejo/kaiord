/**
 * Whether each destination of the data-flow inventory is set up for this
 * athlete now: a Provider with a saved key, a Platform or intervals.icu whose
 * Connection works, Drive while cross-device sync is connected, and Umami
 * when this build carries its site id.
 */
import { useCallback } from "react";

import {
  type DestinationId,
  DESTINATIONS,
} from "../application/data-flows/destinations";
import { useSync } from "../contexts/sync-context";
import { getUmamiWebsiteId } from "../lib/runtime-config";
import { useConnectionSources } from "./connections/use-connection-sources";
import { useActiveProfileLive } from "./use-active-profile-live";
import { useAiProvidersLive } from "./use-ai-providers-live";

export const useDestinationStatus = (): ((id: DestinationId) => boolean) => {
  const providers = useAiProvidersLive();
  const sources = useConnectionSources(useActiveProfileLive()?.id ?? null);
  const { connected } = useSync();

  return useCallback(
    (id: DestinationId) => {
      const destination = DESTINATIONS[id];
      if (destination.group === "provider")
        return (providers ?? []).some(
          (p) => p.type === destination.providerType
        );
      if (destination.group === "platform")
        return sources.some(
          (s) =>
            s.bridgeId === destination.extension && s.status === "connected"
        );
      if (id === "intervals")
        return sources.some(
          (s) => s.id === "intervals" && s.status === "connected"
        );
      if (id === "drive") return connected;
      return getUmamiWebsiteId() !== undefined;
    },
    [providers, sources, connected]
  );
};
