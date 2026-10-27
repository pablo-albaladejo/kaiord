import { useCallback } from "react";

import type { PushToGarminInput } from "../application/chat/tools/chat-tool-deps";
import { useAnalytics, useGarminBridge } from "../contexts";
import { usePersistence } from "../contexts/persistence-context";
import { useToastContext } from "../contexts/ToastContext";
import { useTranslate } from "../i18n/use-translate";
import { doPushToGarmin } from "./chat/do-push-to-garmin";
import { isPushFailure } from "./chat/is-push-failure";
import { buildPlacementDeps } from "./garmin-placement-deps";

/**
 * Binds the push_to_garmin chat action, which runs without a confirmation
 * card: contexts are touched only here, then injected into the plain
 * `doPushToGarmin`, which refuses a workout that is not the active
 * athlete's. A toast tells the athlete the push happened, or that it failed.
 */
export const usePushToGarminOp = (profileId: string | null) => {
  const persistence = usePersistence();
  const { pushWorkout, features } = useGarminBridge();
  const analytics = useAnalytics();
  const toast = useToastContext();
  const t = useTranslate("chat");
  return useCallback(
    async (input: PushToGarminInput) => {
      try {
        if (!profileId) throw new Error("No active profile");
        const output = await doPushToGarmin(
          profileId,
          persistence,
          pushWorkout,
          input.workoutId,
          buildPlacementDeps(features, analytics)
        );
        if (isPushFailure(output)) toast.error(t("toast.garminPushFailed"));
        else toast.success(t("toast.garminPushed"));
        return output;
      } catch (error) {
        toast.error(t("toast.garminPushFailed"));
        throw error;
      }
    },
    [profileId, persistence, pushWorkout, features, analytics, toast, t]
  );
};
