import type { OnGenerateProgress } from "@kaiord/ai";
import type { AiTelemetrySink } from "@kaiord/ai/observability";
import type { Sport } from "@kaiord/core";

import type { HealthShare } from "../application/data-flows/data-flows";
import type { TraceRun } from "../application/trace/trace-run";
import type { PersistencePort } from "../ports/persistence-port";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { AthleteInput } from "./athlete-generation-context";

/** The App's persistence and the usage sink every model call reports to. */
export type GenerationDeps = {
  persistence: PersistencePort;
  usage: AiTelemetrySink;
};

export type GenerateWorkoutOptions = {
  deps: GenerationDeps;
  text: string;
  provider: LlmProviderConfig;
  modelId: string;
  sport?: Sport;
  // The athlete's profile (zones) and custom AI instructions. Omitted, they
  // are read from the app db, so no generation call site can forget them.
  athlete?: AthleteInput;
  // The profile the workout is generated for, when it is not the active one
  // (batch and chat write the workout to a given profile).
  profileId?: string;
  // The run this generation belongs to (a batch, a chat turn). Omitted, the
  // generation is a run of its own and leaves its own Trace, so no call site
  // can forget it. Its usage lands in the usage events either way.
  trace?: TraceRun;
  // Aborts the provider request, and a heart-rate question still waiting.
  abortSignal?: AbortSignal;
  // When set, the output streams and real progress is reported per phase.
  onProgress?: OnGenerateProgress;
  // Asks whether heart-rate data may go, called only when it would; a batch
  // passes one that asks once for all its generations. Omitted, the gate asks.
  askHealth?: () => Promise<HealthShare>;
};
