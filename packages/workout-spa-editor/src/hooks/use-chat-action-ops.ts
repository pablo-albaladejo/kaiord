/**
 * useChatActionOps — binds the chat action tools' side-effecting operations
 * (implemented in `chat-action-ops-impl`) to the active profile + provider.
 * Each op is confirmation-gated upstream, so they run only after approval;
 * push_to_garmin is approved automatically (see `chat-turn-approve`).
 *
 * `syncCoaching` builds a Train2Go transport and calls the `syncWeek` use
 * case directly rather than `useTrain2GoSource`, whose
 * `Train2GoZonesSyncProvider` is not in the global provider tree.
 */
import { useCallback, useMemo } from "react";

import type { ChatActionOps } from "../application/chat/tools/chat-tool-deps";
import { usePersistence } from "../contexts/persistence-context";
import { doSyncCoaching } from "./chat/chat-action-ops-impl";
import type {
  ChatGenerationModel,
  ChatTurnRunRefs,
} from "./use-create-workout-op";
import { requireProfile } from "./use-create-workout-op";
import { useCreateWorkoutOp } from "./use-create-workout-op";
import { useLogOps } from "./use-log-ops";
import { usePushToGarminOp } from "./use-push-to-garmin-op";
import { useSetDataRouteOp } from "./use-set-data-route-op";
import { useTrain2GoCoachingTransport } from "./use-train2go-coaching-transport";

export type { ChatGenerationModel } from "./use-create-workout-op";

export const useChatActionOps = (
  profileId: string | null,
  generation: ChatGenerationModel,
  refs?: ChatTurnRunRefs
): ChatActionOps => {
  const persistence = usePersistence();
  const pushToGarmin = usePushToGarminOp(profileId);
  const setDataRoute = useSetDataRouteOp(profileId);
  const { logHealthMetric, logIntake } = useLogOps(profileId);
  const transport = useTrain2GoCoachingTransport();

  const syncCoaching = useCallback(
    () => doSyncCoaching(persistence, transport, requireProfile(profileId)),
    [persistence, transport, profileId]
  );
  const createWorkout = useCreateWorkoutOp(profileId, generation, refs);

  return useMemo(
    () => ({
      syncCoaching,
      createWorkout,
      logHealthMetric,
      logIntake,
      pushToGarmin,
      setDataRoute,
    }),
    [
      syncCoaching,
      createWorkout,
      logHealthMetric,
      logIntake,
      pushToGarmin,
      setDataRoute,
    ]
  );
};
