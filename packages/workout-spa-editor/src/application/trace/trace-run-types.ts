import type { AiTelemetrySink } from "@kaiord/ai/observability";

import type { TraceRepository } from "../../ports/simple-repositories";
import type {
  TraceFeature,
  TraceOutcome,
  TraceRecord,
  TraceSent,
  TraceToolCall,
} from "../../types/trace-schemas";
import type { TraceSentLog } from "./trace-sent";

export type TraceRun = {
  id: string;
  sink: (forward?: AiTelemetrySink) => AiTelemetrySink;
  sent: TraceSentLog["add"];
  sentSoFar: () => TraceSent[];
  tool: (call: TraceToolCall) => void;
  checkpoint: () => Promise<void>;
  discard: () => Promise<void>;
  finish: (outcome?: TraceOutcome) => Promise<TraceRecord | null>;
};

export type StartTraceRunInput = {
  feature: TraceFeature;
  traces: TraceRepository;
  now?: () => Date;
  newId?: () => string;
  onWriteError?: (error: unknown) => void;
};
