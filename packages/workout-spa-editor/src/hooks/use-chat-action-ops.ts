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

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createTrain2GoCoachingTransport } from "../adapters/train2go/train2go-coaching-transport";
import type {
  ChatActionOps,
  CreateWorkoutInput,
  LogHealthMetricInput,
} from "../application/chat/tools/chat-tool-deps";
import { usePersistence } from "../contexts/persistence-context";
import type { LlmProviderConfig } from "../store/ai-store-types";
import {
  doCreateWorkout,
  doLogHealthMetric,
  doSyncCoaching,
} from "./chat/chat-action-ops-impl";

const requireProfile = (profileId: string | null): string => {
  if (!profileId) throw new Error("No active profile");
  return profileId;
};

export const useChatActionOps = (
  profileId: string | null,
  provider: LlmProviderConfig | null
): ChatActionOps => {
  const persistence = usePersistence();
  const transport = useMemo(
    () =>
      createTrain2GoCoachingTransport(
        () => bridgeDiscovery.getExtensionId("train2go-bridge") ?? ""
      ),
    []
  );

  const syncCoaching = useCallback(
    () => doSyncCoaching(persistence, transport, requireProfile(profileId)),
    [persistence, transport, profileId]
  );
  const createWorkout = useCallback(
    (input: CreateWorkoutInput) => {
      if (!provider) throw new Error("No AI provider configured");
      return doCreateWorkout(
        persistence,
        requireProfile(profileId),
        provider,
        input
      );
    },
    [persistence, profileId, provider]
  );
  const logHealthMetric = useCallback(
    (input: LogHealthMetricInput) =>
      doLogHealthMetric(persistence, requireProfile(profileId), input),
    [persistence, profileId]
  );

  return useMemo(
    () => ({ syncCoaching, createWorkout, logHealthMetric }),
    [syncCoaching, createWorkout, logHealthMetric]
  );
};
