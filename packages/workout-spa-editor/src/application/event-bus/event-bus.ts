/**
 * Minimal callback-list event bus.
 *
 * Chosen over EventTarget because it is synchronous, has no DOM
 * dependency, and lets callers type the payload generically without
 * CustomEvent wrapping. A single module-level instance is exported as
 * `workoutEventBus` — components import it directly or receive it via
 * test injection.
 */

type Listener<T> = (payload: T) => void;

export type EventBus<TMap extends Record<string, unknown>> = {
  emit: <K extends keyof TMap>(event: K, payload: TMap[K]) => void;
  on: <K extends keyof TMap>(event: K, listener: Listener<TMap[K]>) => void;
  off: <K extends keyof TMap>(event: K, listener: Listener<TMap[K]>) => void;
};

export const createEventBus = <
  TMap extends Record<string, unknown>,
>(): EventBus<TMap> => {
  const listeners = new Map<keyof TMap, Set<Listener<unknown>>>();

  const getSet = (event: keyof TMap): Set<Listener<unknown>> => {
    let s = listeners.get(event);
    if (!s) {
      s = new Set();
      listeners.set(event, s);
    }
    return s;
  };

  return {
    emit: (event, payload) => {
      for (const fn of getSet(event)) fn(payload as unknown);
    },
    on: (event, listener) => {
      getSet(event).add(listener as Listener<unknown>);
    },
    off: (event, listener) => {
      getSet(event).delete(listener as Listener<unknown>);
    },
  };
};
