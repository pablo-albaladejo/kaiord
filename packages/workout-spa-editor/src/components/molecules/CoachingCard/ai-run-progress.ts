import type { GenerateProgress } from "@kaiord/ai";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { Translate } from "../../../i18n/use-translate";

/**
 * What the dialog knows about an AI run in flight. `update` is absent until
 * the request is sent; every field after that comes from the run itself.
 */
export type AiRunProgress = {
  modelName: string;
  startedAt: number;
  update?: GenerateProgress;
};

export type SetAiRunProgress = Dispatch<SetStateAction<AiRunProgress | null>>;

/** Live-region copy: changes only when the phase or the attempt changes. */
export const aiPhaseLabel = (t: Translate, run: AiRunProgress): string => {
  const { update, modelName: model } = run;
  if (!update) return t("aiProgress.preparing");
  if (update.phase === "validating") return t("aiProgress.validating");
  if (update.phase === "generating")
    return t("aiProgress.generating", { model });
  if (update.attempt > 1)
    return t("aiProgress.retrying", {
      model,
      attempt: update.attempt,
      max: update.maxAttempts,
    });
  return t("aiProgress.requesting", { model });
};

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
  slot.setProgress({ modelName, startedAt: Date.now() });
  const onProgress = (update: GenerateProgress) => {
    if (slot.abortRef.current !== controller) return;
    slot.setProgress((run) => run && { ...run, update });
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
