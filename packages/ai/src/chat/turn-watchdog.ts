export type TurnStopCause = "aborted" | "timeout";

export type TurnWatchdog = {
  /** Aborts the SDK call on either the caller's signal or an idle stall. */
  signal: AbortSignal;
  /** Which of the two fired first; `undefined` while the turn still runs. */
  cause: () => TurnStopCause | undefined;
  /** Records progress (a chunk or a finished step): restarts the idle timer. */
  touch: () => void;
  dispose: () => void;
};

/**
 * Inactivity watchdog for one turn: merges the caller's abort signal with an
 * idle deadline into the single signal the SDK accepts, and remembers which
 * fired so the turn resolves as `aborted` or `timeout` instead of a generic
 * error. The deadline restarts on every `touch`, so it measures silence — a
 * long turn that keeps streaming is never cut, a stalled one is. `dispose`
 * must run once the turn settles.
 */
export const createTurnWatchdog = (
  external: AbortSignal | undefined,
  idleTimeoutMs: number | undefined
): TurnWatchdog => {
  const controller = new AbortController();
  let stopCause: TurnStopCause | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = (cause: TurnStopCause) => {
    stopCause ??= cause;
    controller.abort(cause);
  };
  const onExternalAbort = () => stop("aborted");
  const touch = () => {
    if (idleTimeoutMs === undefined || stopCause) return;
    clearTimeout(timer);
    timer = setTimeout(() => stop("timeout"), idleTimeoutMs);
  };

  if (external?.aborted) stop("aborted");
  else external?.addEventListener("abort", onExternalAbort, { once: true });
  touch();

  return {
    signal: controller.signal,
    cause: () => stopCause,
    touch,
    dispose: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
};
