import type { LanguageModel } from "ai";
import { modelIdOf, providerOf } from "../agents/prelude";
import type {
  AiTelemetrySink,
  ChatTurnFinishedEvent,
  ChatTurnStatus,
} from "../observability/telemetry-types";
import type { TurnMetrics } from "./turn-stats";

export type ChatTurnTrace = {
  traceId: string;
  startedAt: number;
  promptVersion: string;
  model: LanguageModel;
};

/**
 * Emits the turn's single `chat_turn_finished` event. Built field by field
 * from metrics, never by spreading the turn, so text and messages cannot
 * leak. A thrown turn passes the metrics of the steps it finished (zero when
 * it failed before the first).
 */
export const emitChatTurn = (
  sink: AiTelemetrySink | undefined,
  trace: ChatTurnTrace,
  status: ChatTurnStatus,
  metrics?: TurnMetrics
): void => {
  if (!sink) return;
  const event: ChatTurnFinishedEvent = {
    type: "chat_turn_finished",
    traceId: trace.traceId,
    promptVersion: trace.promptVersion,
    provider: providerOf(trace.model),
    modelId: modelIdOf(trace.model),
    steps: metrics?.steps ?? 0,
    toolNames: metrics?.toolNames ?? [],
    status,
    inputTokens: metrics?.usage?.promptTokens ?? 0,
    outputTokens: metrics?.usage?.completionTokens ?? 0,
    latencyMs: Date.now() - trace.startedAt,
  };
  try {
    sink.emit(event);
  } catch {
    // Telemetry is best-effort: a faulty sink must never fail the turn.
  }
};
