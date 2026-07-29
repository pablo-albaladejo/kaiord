/**
 * useBridgeConnectionsBootstrap
 *
 * Starts the bridge connection store on mount and stops it on unmount, so
 * the polling interval and the visibility listener exist exactly once per
 * app boot. Repeated `start()` calls are no-ops.
 *
 * Mounted by `use-store-hydration`: Settings renders the store's result, so
 * the polling has a consumer.
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
