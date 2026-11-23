/**
 * The Trace of a chat turn: opened when the athlete sends (or retries) a
 * message, kept open while an action waits for them, and closed once the turn
 * settles, fails, or is left. An action still waiting when it closes is
 * recorded as unanswered.
 */
import type { MutableRefObject } from "react";

import {
  startTraceRun,
  type TraceRun,
} from "../../application/trace/trace-run";
import type { PersistencePort } from "../../ports/persistence-port";
import type { TraceOutcome } from "../../types/trace-schemas";

type TraceRef = MutableRefObject<TraceRun | null>;

const waiting = new WeakMap<TraceRun, string>();

export const closeChatTrace = (ref: TraceRef, outcome?: TraceOutcome): void => {
  const run = ref.current;
  ref.current = null;
  if (!run) return;
  const pending = waiting.get(run);
  if (pending)
    run.tool({ name: pending, confirmation: "athlete", result: "unanswered" });
  void run.finish(outcome);
};

export const openChatTrace = (
  ref: TraceRef,
  persistence: Pick<PersistencePort, "traces">
): TraceRun => {
  closeChatTrace(ref);
  ref.current = startTraceRun({ feature: "chat", traces: persistence.traces });
  return ref.current;
};

export const awaitAthlete = (ref: TraceRef, toolName: string): void => {
  if (ref.current) waiting.set(ref.current, toolName);
};

/** The athlete (or the App, for an automatic action) answered the action. */
export const recordAction = (
  ref: TraceRef,
  name: string,
  confirmation: "athlete" | "automatic",
  result: "ok" | "failed" | "refused"
): void => {
  const run = ref.current;
  if (!run) return;
  waiting.delete(run);
  run.tool({ name, confirmation, result });
};
