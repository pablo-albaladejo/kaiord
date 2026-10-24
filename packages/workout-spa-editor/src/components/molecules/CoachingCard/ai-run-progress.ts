import type { GenerateProgress } from "@kaiord/ai";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

/**
 * What the dialog knows about an AI run in flight. `update` is absent until
 * the request is sent; every field after that comes from the run itself.
 * `phaseStartedAt` moves whenever the phase or the attempt changes, so the
 * dialog can say how long the current phase has taken.
 */
export type AiRunProgress = {
  modelName: string;
  startedAt: number;
  phaseStartedAt: number;
  update?: GenerateProgress;
};

const samePhase = (a: GenerateProgress | undefined, b: GenerateProgress) =>
  a?.phase === b.phase && a.attempt === b.attempt;

const withUpdate = (run: AiRunProgress, update: GenerateProgress) => ({
  ...run,
  update,
  phaseStartedAt: samePhase(run.update, update)
    ? run.phaseStartedAt
    : Date.now(),
});

export type SetAiRunProgress = Dispatch<SetStateAction<AiRunProgress | null>>;

/** The in-flight controller doubles as the re-entry lock. */
export type AiRunSlot = {
  abortRef: MutableRefObject<AbortController | null>;
  setProgress: SetAiRunProgress;
};

/**
 * Claims the slot for a new run and returns its controller plus the listener
 * for its updates. An update from a run that is no longer current (cancelled,
 * superseded) is dropped.
 */
export const beginAiRun = (slot: AiRunSlot, modelName: string) => {
  const controller = new AbortController();
  slot.abortRef.current = controller;
  const now = Date.now();
  slot.setProgress({ modelName, startedAt: now, phaseStartedAt: now });
  const onProgress = (update: GenerateProgress) => {
    if (slot.abortRef.current !== controller) return;
    slot.setProgress((run) => run && withUpdate(run, update));
  };
  return { controller, onProgress };
};

/** Releases the slot, unless a newer run (or a cancel) already took it. */
export const endAiRun = (slot: AiRunSlot, controller: AbortController) => {
  if (slot.abortRef.current !== controller) return;
  slot.abortRef.current = null;
  slot.setProgress(null);
};

/** Aborts the provider request in flight, if any, and clears the progress. */
export const cancelAiRun = (slot: AiRunSlot) => {
  slot.abortRef.current?.abort();
  slot.abortRef.current = null;
  slot.setProgress(null);
};
