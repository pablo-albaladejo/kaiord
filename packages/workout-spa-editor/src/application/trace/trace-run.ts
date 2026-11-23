/**
 * One run of the assistant, from its start to its one Trace. The run hands
 * out a telemetry sink (every model call it makes reports there, and is
 * passed on as it came: nothing downstream learns the Trace's id), and
 * is told which Tools ran and what data went where. `finish` writes the Trace
 * once, whatever happens after, and applies the retention rule. While the run
 * waits for the athlete, `checkpoint` keeps it as stopped, so a page closed
 * then still leaves its Trace; `discard` removes a run that never went. A
 * failed write never fails the run.
 */
import type { AiTelemetryEvent } from "@kaiord/ai/observability";

import {
  type TraceOutcome,
  traceSchema,
  type TraceToolCall,
} from "../../types/trace-schemas";
import { buildTrace } from "./build-trace";
import { pruneTraces } from "./prune-traces";
import { serialWrites } from "./serial-writes";
import type { StartTraceRunInput, TraceRun } from "./trace-run-types";
import { createTraceSentLog } from "./trace-sent";

export type { StartTraceRunInput, TraceRun } from "./trace-run-types";

export const startTraceRun = (input: StartTraceRunInput): TraceRun => {
  const now = input.now ?? (() => new Date());
  const id = (input.newId ?? (() => crypto.randomUUID()))();
  const startedAt = now();
  const events: AiTelemetryEvent[] = [];
  const tools: TraceToolCall[] = [];
  const sent = createTraceSentLog();
  let finished = false;
  let kept = false;
  const safely = serialWrites(input.onWriteError);

  const write = async (outcome?: TraceOutcome) => {
    const record = traceSchema.parse(
      buildTrace({
        ...{ id, feature: input.feature, startedAt, finishedAt: now() },
        ...{ events, tools, sent: sent.list(), outcome },
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
        forward?.emit(event);
      },
    }),
    sent: sent.add,
    sentSoFar: sent.list,
    tool: (call) => tools.push(call),
    checkpoint: async () => {
      if (finished) return;
      kept = true;
      await safely(() => write("stopped"));
    },
    discard: async () => {
      if (finished) return;
      finished = true;
      if (kept) await safely(() => input.traces.deleteMany([id]));
    },
    finish: async (outcome) => {
      if (finished) return null;
      finished = true;
      return safely(() => write(outcome));
    },
  };
};
