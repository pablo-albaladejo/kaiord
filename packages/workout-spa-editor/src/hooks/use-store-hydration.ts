import { useAiHydration } from "./use-ai-hydration";
import { useGarminDetection } from "./use-garmin-detection";

export const useStoreHydration = () => {
  useAiHydration();
  useGarminDetection();
};
