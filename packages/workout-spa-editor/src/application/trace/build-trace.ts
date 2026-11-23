/**
 * Folds what a run collected (its telemetry events, Tool calls and the data
 * it sent) into the stored Trace. Pure. Each model the run reached is priced
 * on its own with `priceRun`, failed attempts included; the total is unknown
 * when any of them is.
 */
import type { AiTelemetryEvent } from "@kaiord/ai/observability";

import type {
  TraceFeature,
  TraceOutcome,
  TraceRecord,
  TraceSent,
  TraceToolCall,
  TraceUnit,
} from "../../types/trace-schemas";
import { costsOf, totalOf } from "./trace-costs";
import { derivedOutcome } from "./trace-outcome";

export type TraceParts = {
  id: string;
  feature: TraceFeature;
  startedAt: Date;
  finishedAt: Date;
  events: readonly AiTelemetryEvent[];
  tools: readonly TraceToolCall[];
  sent: readonly TraceSent[];
  outcome?: TraceOutcome;
};

const unitOf = (event: AiTelemetryEvent): TraceUnit =>
  event.type === "chat_turn_finished"
    ? { promptVersion: event.promptVersion }
    : {
        agentId: event.agentId,
        agentVersion: event.agentVersion,
        promptId: event.promptId,
        promptVersion: event.promptVersion,
      };

const uniqueUnits = (events: readonly AiTelemetryEvent[]): TraceUnit[] => [
  ...new Map(
    events.map((e) => [JSON.stringify(unitOf(e)), unitOf(e)])
  ).values(),
];

const retriesOf = (event: AiTelemetryEvent): number => {
  if (event.type === "chat_turn_finished") return 0;
  return (
    event.timings?.retryReasons.length ?? Math.max(0, event.requests.length - 1)
  );
};

export const buildTrace = (parts: TraceParts): TraceRecord => {
  const cost = costsOf(parts.events, parts.startedAt);
  return {
    id: parts.id,
    feature: parts.feature,
    startedAt: parts.startedAt.toISOString(),
    finishedAt: parts.finishedAt.toISOString(),
    latencyMs: Math.max(
      0,
      parts.finishedAt.getTime() - parts.startedAt.getTime()
    ),
    outcome: parts.outcome ?? derivedOutcome(parts.events),
    modelCalls: parts.events.reduce((n, e) => n + e.requests.length, 0),
    retries: parts.events.reduce((n, e) => n + retriesOf(e), 0),
    units: uniqueUnits(parts.events),
    tools: [...parts.tools],
    cost,
    totalUsd: totalOf(cost),
    sent: [...parts.sent],
  };
};
