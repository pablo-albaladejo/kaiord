/**
 * useBridgeDiscoveryBootstrap
 *
 * Starts the bridge discovery listener on mount and stops it on unmount.
 * The singleton `bridgeDiscovery` is started exactly once per app boot —
 * repeated calls to start() are no-ops.
 */

import { useEffect } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";

export const useBridgeDiscoveryBootstrap = () => {
  useEffect(() => {
    bridgeDiscovery.start();
    return () => {
      bridgeDiscovery.stop();
    };
  }, []);
};
