import type { TraceRecord } from "../types/trace-schemas";

/** A finished chat Trace; override any field. */
export const buildTrace = (over: Partial<TraceRecord> = {}): TraceRecord => ({
  id: "trace-1",
  feature: "chat",
  startedAt: "2026-11-20T10:00:00.000Z",
  finishedAt: "2026-11-20T10:00:02.000Z",
  latencyMs: 2000,
  outcome: "ok",
  modelCalls: 1,
  retries: 0,
  units: [{ promptVersion: "chat-1" }],
  tools: [],
  cost: [],
  totalUsd: null,
  sent: [{ to: "anthropic", kinds: ["messages"] }],
  ...over,
});
