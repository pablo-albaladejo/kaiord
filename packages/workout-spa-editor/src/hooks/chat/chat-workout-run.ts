/**
 * What the chat's create-workout action runs with, and the health check its
 * description passes before it goes to the generation Provider.
 */
import { descriptionHealth } from "../../application/chat/description-health";
import { healthWithheldError } from "../../application/chat/health-withheld";
import type { HealthShare } from "../../application/data-flows/data-flows";
import { healthKindsOf } from "../../application/data-flows/data-flows";
import type { TraceRun } from "../../application/trace/trace-run";
import type { GenerationDeps } from "../../lib/generate-workout";
import {
  type HealthQuestion,
  type HealthRequestOptions,
  healthSharingGate,
} from "../../lib/health-sharing-gate";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";

export type ChatWorkoutRun = {
  persistence: PersistencePort;
  deps: GenerationDeps;
  profileId: string;
  /** The generation Provider, which may not be the chat's. */
  provider: LlmProviderConfig;
  modelId: string;
  title: string;
  /** The turn's Trace: what it sent so far says what the description holds. */
  trace?: TraceRun;
  askHealth?: (
    question: HealthQuestion,
    options: HealthRequestOptions
  ) => Promise<HealthShare>;
};

/** Without the turn's Trace nothing says what it read: count it all. */
const healthIn = (run: ChatWorkoutRun) =>
  run.trace
    ? descriptionHealth(run.trace.sentSoFar(), run.provider.type)
    : { kinds: healthKindsOf("assistantWorkout"), alreadyAt: false };

export const clearDescription = async (run: ChatWorkoutRun): Promise<void> => {
  const { kinds, alreadyAt } = healthIn(run);
  if (kinds.length === 0) return;
  const to = run.provider.type;
  if (!alreadyAt) {
    const ask = run.askHealth ?? healthSharingGate.request;
    const share = await ask(
      { flow: "assistantWorkout", providerType: to },
      { onWait: () => void run.trace?.checkpoint() }
    );
    if (share === "withhold") throw healthWithheldError(to);
  }
  run.trace?.sent(to, ["workoutDescription"], kinds);
};
