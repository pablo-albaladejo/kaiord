import { useEffect } from "react";
import { useAiStore } from "../store/ai-store";
import { useGarminStore } from "../store/garmin-store";

export const useStoreHydration = () => {
  const hydrateAi = useAiStore((s) => s.hydrate);
  const hydrateGarmin = useGarminStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAi();
    hydrateGarmin();
  }, [hydrateAi, hydrateGarmin]);
};
