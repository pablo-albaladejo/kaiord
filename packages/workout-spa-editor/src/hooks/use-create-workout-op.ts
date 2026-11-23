/**
 * The chat's create_workout op, bound to the active profile and the
 * generation model. A workout refused because its description may carry
 * health data to a Provider the athlete keeps it from is said to the
 * athlete in their language; the model gets the fixed answer.
 */
import { type MutableRefObject, useCallback } from "react";

import { providerName } from "../application/ai/provider-label";
import { healthWithheldTo } from "../application/chat/health-withheld";
import type { CreateWorkoutInput } from "../application/chat/tools/chat-tool-deps";
import type { TraceRun } from "../application/trace/trace-run";
import { usePersistence } from "../contexts/persistence-context";
import { useToastContext } from "../contexts/ToastContext";
import { useActiveLocale } from "../i18n/LocaleProvider";
import { getTranslate, useTranslate } from "../i18n/use-translate";
import type { LlmProviderConfig } from "../store/ai-store-types";
import {
  type ChatWorkoutRun,
  doCreateWorkout,
} from "./chat/chat-create-workout";
import { useGenerationDeps } from "./use-generation-deps";

export const requireProfile = (profileId: string | null): string => {
  if (!profileId) throw new Error("No active profile");
  return profileId;
};

export type ChatGenerationModel = {
  provider: LlmProviderConfig | null;
  modelId: string | null;
};

export const useCreateWorkoutOp = (
  profileId: string | null,
  generation: ChatGenerationModel,
  traceRef?: MutableRefObject<TraceRun | null>
) => {
  const persistence = usePersistence();
  const { provider, modelId } = generation;
  const locale = useActiveLocale();
  const deps = useGenerationDeps();
  const toast = useToastContext();
  const t = useTranslate("errors");
  const createWorkout = useCallback(
    async (input: CreateWorkoutInput) => {
      if (!provider || !modelId) throw new Error("No AI provider configured");
      const run: ChatWorkoutRun = {
        ...{ persistence, deps, provider, modelId },
        profileId: requireProfile(profileId),
        title: getTranslate("chat", locale)("draft.workoutTitle"),
        trace: traceRef?.current ?? undefined,
      };
      try {
        return await doCreateWorkout(run, input);
      } catch (error) {
        const to = healthWithheldTo(error);
        if (to)
          toast.info(
            t("assistantWorkout.withheld", { provider: providerName(to) })
          );
        throw error;
      }
    },
    [
      persistence,
      deps,
      profileId,
      provider,
      modelId,
      locale,
      traceRef,
      toast,
      t,
    ]
  );
  return createWorkout;
};
