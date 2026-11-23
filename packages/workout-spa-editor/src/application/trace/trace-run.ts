/**
 * One run of the assistant, from its start to its one Trace. The run hands
 * out a telemetry sink (every model call it makes reports there, and is
 * passed on under the Trace's id, so the usage events name their Trace), and
 * is told which Tools ran and what data went where. `finish` writes the Trace
 * once, whatever happens after, and applies the retention rule. A failed
 * write never fails the run.
 */
import type {
  AiTelemetryEvent,
  AiTelemetrySink,
} from "@kaiord/ai/observability";
import type { LlmProviderType } from "@kaiord/ai/providers";

import type { TraceRepository } from "../../ports/simple-repositories";
import {
  type TraceFeature,
  type TraceOutcome,
  type TraceRecord,
  traceSchema,
  type TraceToolCall,
} from "../../types/trace-schemas";
import { buildTrace } from "./build-trace";
import { pruneTraces } from "./prune-traces";

export type TraceRun = {
  id: string;
  sink: (forward?: AiTelemetrySink) => AiTelemetrySink;
  sent: (to: LlmProviderType, kinds: readonly string[]) => void;
  tool: (call: TraceToolCall) => void;
  finish: (outcome?: TraceOutcome) => Promise<TraceRecord | null>;
};

export type StartTraceRunInput = {
  feature: TraceFeature;
  traces: TraceRepository;
  now?: () => Date;
  newId?: () => string;
  onWriteError?: (error: unknown) => void;
};

export const startTraceRun = (input: StartTraceRunInput): TraceRun => {
  const now = input.now ?? (() => new Date());
  const id = (input.newId ?? (() => crypto.randomUUID()))();
  const startedAt = now();
  const events: AiTelemetryEvent[] = [];
  const tools: TraceToolCall[] = [];
  const sent = new Map<string, string[]>();
  let finished = false;

  const write = async (outcome?: TraceOutcome) => {
    const record = traceSchema.parse(
      buildTrace({
        ...{ id, feature: input.feature, startedAt, finishedAt: now() },
        ...{ events, tools, sent, outcome },
      })
    );
    await input.traces.put(record);
    await pruneTraces(input.traces, now());
    return record;
  };

  return {
    id,
    sink: (forward) => ({
      emit: (event) => {
        events.push(event);
        forward?.emit({ ...event, traceId: id });
      },
    }),
    sent: (to, kinds) => {
      const known = sent.get(to) ?? [];
      sent.set(to, [...known, ...kinds.filter((k) => !known.includes(k))]);
    },
    tool: (call) => tools.push(call),
    finish: async (outcome) => {
      if (finished) return null;
      finished = true;
      try {
        return await write(outcome);
      } catch (error) {
        input.onWriteError?.(error);
        return null;
      }
    },
  };
};
