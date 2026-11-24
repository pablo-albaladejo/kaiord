import { useCallback } from "react";

import type {
  SetAuthorityInput,
  SetDataRouteInput,
} from "../application/chat/tools/source-tool-inputs";
import { usePersistence } from "../contexts/persistence-context";
import { doSetAuthority } from "./chat/do-set-authority";
import { doSetDataRoute } from "./chat/do-set-data-route";

/**
 * Binds the confirmation-gated set_data_route and set_authority chat
 * actions: contexts are touched only here, then injected into the plain
 * `doSetDataRoute` / `doSetAuthority`.
 */
export const useSetDataRouteOps = (profileId: string | null) => {
  const persistence = usePersistence();
  const setDataRoute = useCallback(
    (input: SetDataRouteInput) => {
      if (!profileId) throw new Error("No active profile");
      return doSetDataRoute(persistence, profileId, input);
    },
    [persistence, profileId]
  );
  const setAuthority = useCallback(
    (input: SetAuthorityInput) => {
      if (!profileId) throw new Error("No active profile");
      return doSetAuthority(persistence, profileId, input);
    },
    [persistence, profileId]
  );
  return { setDataRoute, setAuthority };
};
