/**
 * useBridgeDiscoveryBootstrap
 *
 * Starts the bridge discovery listener on mount and stops it on unmount.
 * The singleton `bridgeDiscovery` is started exactly once per app boot —
 * repeated calls to start() are no-ops.
 */

import { useEffect } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { markDiscoveryStarted } from "./discovery-clock";

export const useBridgeDiscoveryBootstrap = () => {
  useEffect(() => {
    // Stamped here rather than inside the singleton because this is the point
    // at which listening actually begins for this boot; surfaces that count
    // detected bridges measure their grace window from it.
    markDiscoveryStarted();
    bridgeDiscovery.start();
    return () => {
      bridgeDiscovery.stop();
    };
  }, []);
};
