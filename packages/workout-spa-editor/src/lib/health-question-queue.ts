/**
 * The questions waiting for the athlete, one Provider at a time: a question
 * for a Provider waits for the one before it to be answered, then reads the
 * standing answer again, so "always" given to the first is never asked a
 * second time. Runs asking the same question share it; it is cancelled once
 * every run that asked it has stopped.
 */
import type { LlmProviderType } from "@kaiord/ai/provider-types";

import type { HealthShare } from "../application/data-flows/data-flows";

type Shared = {
  answer: Promise<HealthShare>;
  runs: number;
  cancel: AbortController;
};

export const abortError = () => new DOMException("Aborted", "AbortError");

export const createHealthQuestionQueue = () => {
  const shared = new Map<string, Shared>();
  const last = new Map<LlmProviderType, Promise<unknown>>();

  const open = (
    key: string,
    provider: LlmProviderType,
    decide: (cancelled: AbortSignal) => Promise<HealthShare>
  ): Shared => {
    const cancel = new AbortController();
    const before = last.get(provider) ?? Promise.resolve();
    const answer = before.then(() => decide(cancel.signal));
    last.set(
      provider,
      answer.catch(() => undefined)
    );
    const entry: Shared = { answer, runs: 0, cancel };
    shared.set(key, entry);
    const close = () => shared.get(key) === entry && shared.delete(key);
    answer.then(close, close);
    return entry;
  };

  const leave = (key: string, entry: Shared) => {
    entry.runs -= 1;
    if (entry.runs > 0) return;
    if (shared.get(key) === entry) shared.delete(key);
    entry.cancel.abort();
  };

  /** The answer for one run; it rejects as aborted when `signal` stops it. */
  const join = (
    key: string,
    provider: LlmProviderType,
    decide: (cancelled: AbortSignal) => Promise<HealthShare>,
    signal?: AbortSignal
  ): Promise<HealthShare> => {
    const entry = shared.get(key) ?? open(key, provider, decide);
    entry.runs += 1;
    return new Promise<HealthShare>((resolve, reject) => {
      const stop = () => {
        leave(key, entry);
        reject(abortError());
      };
      signal?.addEventListener("abort", stop, { once: true });
      const settle = () => signal?.removeEventListener("abort", stop);
      entry.answer.then(
        (value) => (settle(), resolve(value)),
        (error: unknown) => (settle(), reject(error))
      );
    });
  };

  return { join };
};
