/**
 * useChatActionOps — binds the chat action tools' side-effecting operations
 * (implemented in `chat-action-ops-impl`) to the active profile + provider.
 * Each op is confirmation-gated upstream, so they run only after approval.
 *
 * `syncCoaching` builds a Train2Go transport and calls the `syncWeek` use
 * case directly rather than `useTrain2GoSource`, whose
 * `Train2GoZonesSyncProvider` is not in the global provider tree.
 */
import { useCallback, useMemo } from "react";

import type {
  ChatActionOps,
  CreateWorkoutInput,
} from "../application/chat/tools/chat-tool-deps";
import { usePersistence } from "../contexts/persistence-context";
import type { LlmProviderConfig } from "../store/ai-store-types";
import { doCreateWorkout, doSyncCoaching } from "./chat/chat-action-ops-impl";
import { useLogOps } from "./use-log-ops";
import { usePushToGarminOp } from "./use-push-to-garmin-op";
import { useSetDataRouteOp } from "./use-set-data-route-op";
import { useTrain2GoCoachingTransport } from "./use-train2go-coaching-transport";

const requireProfile = (profileId: string | null): string => {
  if (!profileId) throw new Error("No active profile");
  return profileId;
};

export type ChatGenerationModel = {
  provider: LlmProviderConfig | null;
  modelId: string | null;
};

export const useChatActionOps = (
  profileId: string | null,
  generation: ChatGenerationModel
): ChatActionOps => {
  const persistence = usePersistence();
  const pushToGarmin = usePushToGarminOp();
  const setDataRoute = useSetDataRouteOp(profileId);
  const { logHealthMetric, logIntake } = useLogOps(profileId);
  const transport = useTrain2GoCoachingTransport();

  const syncCoaching = useCallback(
    () => doSyncCoaching(persistence, transport, requireProfile(profileId)),
    [persistence, transport, profileId]
  );
  const { provider, modelId } = generation;
  const createWorkout = useCallback(
    (input: CreateWorkoutInput) => {
      if (!provider || !modelId) throw new Error("No AI provider configured");
      return doCreateWorkout(
        persistence,
        requireProfile(profileId),
        provider,
        modelId,
        input
      );
    },
    [persistence, profileId, provider, modelId]
  );

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
