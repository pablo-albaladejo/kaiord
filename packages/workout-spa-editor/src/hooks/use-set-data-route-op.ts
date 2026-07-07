import { useCallback } from "react";

import type { SetDataRouteInput } from "../application/chat/tools/chat-tool-deps";
import { usePersistence } from "../contexts/persistence-context";
import { doSetDataRoute } from "./chat/do-set-data-route";

/**
 * Binds the confirmation-gated set_data_route chat action: contexts are
 * touched only here, then injected into the plain `doSetDataRoute`.
 */
export const useSetDataRouteOp = (profileId: string | null) => {
  const persistence = usePersistence();
  return useCallback(
    (input: SetDataRouteInput) => {
      if (!profileId) throw new Error("No active profile");
      return doSetDataRoute(persistence, profileId, input);
    },
    [persistence, profileId]
  );
};
