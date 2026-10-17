import type { LanguageModel } from "ai";
import { modelIdOf, providerOf } from "../agents/prelude";
import type {
  AiTelemetrySink,
  ChatTurnFinishedEvent,
  ChatTurnStatus,
} from "../observability/telemetry-types";
import type { RawTurn } from "./run-turn";

export type ChatTurnTrace = {
  traceId: string;
  startedAt: number;
  promptVersion: string;
  model: LanguageModel;
};

/**
 * Emits the turn's single `chat_turn_finished` event. Built field by field
 * from metrics, never by spreading `raw`, so text and messages cannot leak. A
 * thrown turn (`raw` undefined) reports zero steps and tokens.
 */
export const emitChatTurn = (
  sink: AiTelemetrySink | undefined,
  trace: ChatTurnTrace,
  status: ChatTurnStatus,
  raw?: RawTurn
): void => {
  if (!sink) return;
  const event: ChatTurnFinishedEvent = {
    type: "chat_turn_finished",
    traceId: trace.traceId,
    promptVersion: trace.promptVersion,
    provider: providerOf(trace.model),
    modelId: modelIdOf(trace.model),
    steps: raw?.steps ?? 0,
    toolNames: raw?.toolNames ?? [],
    status,
    inputTokens: raw?.usage?.promptTokens ?? 0,
    outputTokens: raw?.usage?.completionTokens ?? 0,
    latencyMs: Date.now() - trace.startedAt,
  };
  try {
    sink.emit(event);
  } catch {
    // Telemetry is best-effort: a faulty sink must never fail the turn.
  }
};
