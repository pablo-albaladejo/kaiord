/**
 * useLatestRef — keeps a `ref.current` synced with the latest render's value.
 *
 * Use case: a closure (an in-flight async call, an event handler, a long-
 * lived effect) needs to read the freshest value of a prop or hook return,
 * but should NOT be re-created on every change. `useLatestRef` lets the
 * closure read `ref.current` lazily without resubscribing.
 *
 * Specifically wired into `useAiGeneration` so the LLM-call closure can
 * read the latest active profile (live-hook value) at call time without
 * cancelling an in-flight generation when the profile changes.
 */

import { useEffect, useRef } from "react";

export const useLatestRef = <T>(value: T): { readonly current: T } => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};
