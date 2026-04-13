import { useEffect } from "react";

import { useAiStore } from "../store/ai-store";

export const useAiHydration = () => {
  const hydrateAi = useAiStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAi();
  }, [hydrateAi]);
};
