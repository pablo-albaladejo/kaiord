import { useAiHydration } from "./use-ai-hydration";
import { useBridgeDiscoveryBootstrap } from "./use-bridge-discovery-bootstrap";
import { useGarminDetection } from "./use-garmin-detection";
import { useStorageProbe } from "./use-storage-probe";
import { useTrain2GoDetection } from "./use-train2go-detection";

export const useStoreHydration = () => {
  useStorageProbe();
  useAiHydration();
  useBridgeDiscoveryBootstrap();
  useGarminDetection();
  useTrain2GoDetection();
};
