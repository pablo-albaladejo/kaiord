import type { Analytics } from "@kaiord/core";
import type { MutableRefObject } from "react";

import type { ModelNamer } from "../../../hooks/use-model-name";
import type { GenerationDeps } from "../../../lib/generate-workout";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { SetAiRunProgress } from "./ai-run-progress";
import type { AiFailureState } from "./use-coaching-ai-types";

/** Everything one AI run of the coaching dialog reads and writes. */
export type StartAiCtx = {
  /** Rebuild the existing Workout in place (the athlete asked to). */
  regenerate: boolean;
  activity: CoachingActivity | null;
  profileId: string | null;
  expandActivity: (activity: CoachingActivity) => void;
  providers: LlmProviderConfig[] | undefined;
  bindings: AiModelBinding[] | undefined;
  deps: GenerationDeps;
  analytics: Analytics;
  abortRef: MutableRefObject<AbortController | null>;
  setFailure: (f: AiFailureState | null) => void;
  setProgress: SetAiRunProgress;
  onClose: () => void;
  navigate: (to: string) => void;
  onFailureToast: () => void;
  /** The Workout was built, but without its step notes. */
  onStepNotesToast: () => void;
  nameModel: ModelNamer;
};
