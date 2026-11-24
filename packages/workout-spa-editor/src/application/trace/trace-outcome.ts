/** A run failed when one of its model calls failed; stopped when it was cut. */
import type { AiTelemetryEvent } from "@kaiord/ai/observability";

import type { TraceOutcome } from "../../types/trace-schemas";

const FAILED_CHAT = new Set(["error", "timeout"]);

export const derivedOutcome = (
  events: readonly AiTelemetryEvent[]
): TraceOutcome => {
  const failed = events.some((e) =>
    e.type === "chat_turn_finished"
      ? FAILED_CHAT.has(e.status)
      : e.type === "run_failed"
  );
  if (failed) return "failed";
  const stopped = events.some(
    (e) => e.type === "chat_turn_finished" && e.status === "aborted"
  );
  return stopped ? "stopped" : "ok";
};
