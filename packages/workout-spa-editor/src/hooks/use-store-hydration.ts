import { useBridgeConnectionsBootstrap } from "./use-bridge-connections-bootstrap";
import { useBridgeDiscoveryBootstrap } from "./use-bridge-discovery-bootstrap";
import { useGarminDetection } from "./use-garmin-detection";
import { useStorageProbe } from "./use-storage-probe";
import { useTrain2GoDetection } from "./use-train2go-detection";

// The connection store polls five bridges, so it stays mounted only while
// something renders its result: Settings derives its attention surfaces and
// its Connections row value from it.
export const useStoreHydration = () => {
  useStorageProbe();
  useBridgeDiscoveryBootstrap();
  useBridgeConnectionsBootstrap();
  useGarminDetection();
  useTrain2GoDetection();
};
