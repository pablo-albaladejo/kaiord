/**
 * useBridgeConnectionsBootstrap
 *
 * Starts the bridge connection store on mount and stops it on unmount, so
 * the polling interval and the visibility listener exist exactly once per
 * app boot. Repeated `start()` calls are no-ops.
 *
 * Not mounted yet: polling five bridges with no consumer rendering the
 * result is pure cost. The wave that ships the first connections UI mounts
 * this in `use-store-hydration`.
 */

import { useEffect } from "react";

import { bridgeConnections } from "../adapters/bridge/bridge-connection-store";

export const useBridgeConnectionsBootstrap = () => {
  useEffect(() => {
    bridgeConnections.start();
    return () => {
      bridgeConnections.stop();
    };
  }, []);
};
