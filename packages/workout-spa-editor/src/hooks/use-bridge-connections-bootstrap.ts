/**
 * useBridgeConnectionsBootstrap
 *
 * Starts the bridge connection store on mount and stops it on unmount, so
 * the polling interval and the visibility listener exist exactly once per
 * app boot. Repeated `start()` calls are no-ops.
 *
 * Mounted by `use-store-hydration` rather than by the Connections page: the
 * store's 30-second positive cache and 5-minute cadence only pay off across
 * navigations, and a page-scoped mount would restart the poll — and re-probe
 * every bridge — each time the user opened the page.
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
