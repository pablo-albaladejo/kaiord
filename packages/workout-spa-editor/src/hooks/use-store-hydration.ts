import { useAiHydration } from "./use-ai-hydration";
import { useGarminDetection } from "./use-garmin-detection";
import { useStorageProbe } from "./use-storage-probe";
import { useTrain2GoDetection } from "./use-train2go-detection";

export const useStoreHydration = () => {
  useStorageProbe();
  useAiHydration();
  useGarminDetection();
  useTrain2GoDetection();
};
