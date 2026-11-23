/**
 * The one place that decides whether a request may carry the athlete's
 * health data to a Provider. A standing answer decides at once; without one
 * the athlete is asked through the notice on screen, and the question counts
 * as unsaved work while it waits. With nothing on screen to ask (no notice
 * mounted), the request goes without the health data.
 */
import type { LlmProviderType } from "@kaiord/ai/providers";

import type { HealthFlowId } from "../application/data-flows/data-flows";
import {
  type HealthSharingStore,
  healthSharingStore,
} from "./health-sharing-store";
import { armUnsavedEdits } from "./unsaved-edits";

export type HealthQuestion = {
  flow: HealthFlowId;
  providerType: LlmProviderType;
};
export type HealthShareAnswer = "once" | "always" | "never";
export type HealthShare = "send" | "withhold";
export type HealthAsker = (
  question: HealthQuestion
) => Promise<HealthShareAnswer>;

export type HealthSharingGate = {
  request: (question: HealthQuestion) => Promise<HealthShare>;
  /** Mounts the notice that asks; returns its unmount. */
  setAsker: (asker: HealthAsker) => () => void;
};

const keyOf = (q: HealthQuestion) => `${q.providerType}:${q.flow}`;

export function createHealthSharingGate(
  store: HealthSharingStore
): HealthSharingGate {
  let asker: HealthAsker | null = null;
  const waiting = new Map<string, Promise<HealthShare>>();

  const ask = async (question: HealthQuestion, current: HealthAsker) => {
    const disarm = armUnsavedEdits();
    try {
      const answer = await current(question);
      if (answer !== "once") store.set(question.providerType, answer);
      return answer === "never" ? "withhold" : "send";
    } finally {
      disarm();
      waiting.delete(keyOf(question));
    }
  };

  const request = async (question: HealthQuestion): Promise<HealthShare> => {
    const standing = store.read()[question.providerType];
    if (standing) return standing === "always" ? "send" : "withhold";
    if (!asker) return "withhold";
    const key = keyOf(question);
    const pending = waiting.get(key) ?? ask(question, asker);
    waiting.set(key, pending);
    return pending;
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
  providerType: LlmProviderType
): Promise<HealthShare> =>
  healthSharingGate.request({ flow: "generation", providerType });
