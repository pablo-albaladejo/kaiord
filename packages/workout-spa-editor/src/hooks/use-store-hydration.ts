import { useBridgeDiscoveryBootstrap } from "./use-bridge-discovery-bootstrap";
import { useGarminDetection } from "./use-garmin-detection";
import { useStorageProbe } from "./use-storage-probe";
import { useTrain2GoDetection } from "./use-train2go-detection";

// `useBridgeConnectionsBootstrap` is intentionally NOT mounted here: it would
// poll five bridges every five minutes with nothing rendering the result. The
// first wave that ships a connections consumer mounts it.
export const useStoreHydration = () => {
  useStorageProbe();
  useBridgeDiscoveryBootstrap();
  useGarminDetection();
  useTrain2GoDetection();
};
