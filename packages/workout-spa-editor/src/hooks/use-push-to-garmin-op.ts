import { useCallback } from "react";

import type { PushToGarminInput } from "../application/chat/tools/chat-tool-deps";
import { useAnalytics, useGarminBridge } from "../contexts";
import { usePersistence } from "../contexts/persistence-context";
import { doPushToGarmin } from "./chat/do-push-to-garmin";
import { buildPlacementDeps } from "./garmin-placement-deps";

/**
 * Binds the confirmation-gated push_to_garmin chat action: contexts are
 * touched only here, then injected into the plain `doPushToGarmin`.
 */
export const usePushToGarminOp = () => {
  const persistence = usePersistence();
  const { pushWorkout, features } = useGarminBridge();
  const analytics = useAnalytics();
  return useCallback(
    (input: PushToGarminInput) =>
      doPushToGarmin(
        persistence,
        pushWorkout,
        input.workoutId,
        buildPlacementDeps(features, analytics)
      ),
    [persistence, pushWorkout, features, analytics]
  );
};
