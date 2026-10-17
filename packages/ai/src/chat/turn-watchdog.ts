export type TurnStopCause = "aborted" | "timeout";

export type TurnWatchdog = {
  /** Aborts the SDK call on either the caller's signal or the deadline. */
  signal: AbortSignal;
  /** Which of the two fired first; `undefined` while the turn still runs. */
  cause: () => TurnStopCause | undefined;
  dispose: () => void;
};

/**
 * Watchdog supervisor for one turn: merges the caller's abort signal with a
 * wall-clock deadline into the single signal the SDK accepts, and remembers
 * which one fired so the turn resolves as `aborted` or `timeout` instead of
 * a generic error. `dispose` must run once the turn settles.
 */
export const createTurnWatchdog = (
  external: AbortSignal | undefined,
  timeoutMs: number | undefined
): TurnWatchdog => {
  const controller = new AbortController();
  let stopCause: TurnStopCause | undefined;
  const stop = (cause: TurnStopCause) => {
    stopCause ??= cause;
    controller.abort(cause);
  };
  const onExternalAbort = () => stop("aborted");

  if (external?.aborted) stop("aborted");
  else external?.addEventListener("abort", onExternalAbort, { once: true });
  const timer =
    timeoutMs !== undefined
      ? setTimeout(() => stop("timeout"), timeoutMs)
      : undefined;

  return {
    signal: controller.signal,
    cause: () => stopCause,
    dispose: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
};
