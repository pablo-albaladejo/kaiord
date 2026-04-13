import { useAiHydration } from "./use-ai-hydration";
import { useGarminDetection } from "./use-garmin-detection";
import { useTrain2GoDetection } from "./use-train2go-detection";

export const useStoreHydration = () => {
  useAiHydration();
  useGarminDetection();
  useTrain2GoDetection();
};
