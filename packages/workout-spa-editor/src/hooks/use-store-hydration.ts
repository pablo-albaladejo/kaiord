import { useEffect } from "react";

import { useAiStore } from "../store/ai-store";
import { useGarminStore } from "../store/garmin-store";

export const useStoreHydration = () => {
  const hydrateAi = useAiStore((s) => s.hydrate);
  const detectExtension = useGarminStore((s) => s.detectExtension);

  useEffect(() => {
    hydrateAi();
    detectExtension();
  }, [hydrateAi, detectExtension]);
};
