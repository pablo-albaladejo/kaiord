/**
 * The one place that decides whether a request may carry the athlete's
 * health data to a Provider. A standing answer decides at once; without one
 * the athlete is asked through the notice on screen, and the question counts
 * as unsaved work while it waits. With nothing on screen to ask (no notice
 * mounted), the request goes without the health data. A run that stops while
 * it waits gets an abort instead of an answer, and its question is taken off
 * the screen once no other run waits on it; `onWait` tells the run it waits.
 */
import type { LlmProviderType } from "@kaiord/ai/provider-types";

import type {
  HealthFlowId,
  HealthShare,
} from "../application/data-flows/data-flows";
import { createHealthDecision } from "./health-decision";
import { abortError, createHealthQuestionQueue } from "./health-question-queue";
import {
  type HealthSharingStore,
  healthSharingStore,
} from "./health-sharing-store";

export type HealthQuestion = {
  flow: HealthFlowId;
  providerType: LlmProviderType;
};
export type HealthShareAnswer = "once" | "always" | "never";
export type { HealthShare };
export type HealthAsker = (
  question: HealthQuestion,
  cancelled: AbortSignal
) => Promise<HealthShareAnswer>;
export type HealthRequestOptions = {
  signal?: AbortSignal;
  onWait?: () => void;
};

export type HealthSharingGate = {
  request: (
    question: HealthQuestion,
    options?: HealthRequestOptions
  ) => Promise<HealthShare>;
  /** Mounts the notice that asks; returns its unmount. */
  setAsker: (asker: HealthAsker) => () => void;
};

const keyOf = (q: HealthQuestion) => `${q.providerType}:${q.flow}`;

export function createHealthSharingGate(
  store: HealthSharingStore
): HealthSharingGate {
  let asker: HealthAsker | null = null;
  const queue = createHealthQuestionQueue();
  const { standing, decide } = createHealthDecision(store, () => asker);

  const request: HealthSharingGate["request"] = async (q, options = {}) => {
    const known = standing(q);
    if (known) return known;
    if (!asker) return "withhold";
    if (options.signal?.aborted) throw abortError();
    options.onWait?.();
    const decideThis = (cancelled: AbortSignal) => decide(q, cancelled);
    return queue.join(keyOf(q), q.providerType, decideThis, options.signal);
  };

  const setAsker = (next: HealthAsker) => {
    asker = next;
    return () => {
      if (asker === next) asker = null;
    };
  };

  return { request, setAsker };
}

export const healthSharingGate = createHealthSharingGate(healthSharingStore);

/** Asks once, however many times it is called: a batch's generations. */
export const askOnce = (
  ask: () => Promise<HealthShare>
): (() => Promise<HealthShare>) => {
  let answer: Promise<HealthShare> | null = null;
  return () => (answer ??= ask());
};

export const askGenerationHealth = (
  providerType: LlmProviderType,
  options?: HealthRequestOptions
): Promise<HealthShare> =>
  healthSharingGate.request({ flow: "generation", providerType }, options);
