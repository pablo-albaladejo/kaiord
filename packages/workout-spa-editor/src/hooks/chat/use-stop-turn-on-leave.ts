import { type MutableRefObject, useEffect, useRef } from "react";

import type { TraceRun } from "../../application/trace/trace-run";
import { closeChatTrace } from "./chat-trace";

type Refs = {
  abortRef: MutableRefObject<AbortController | null>;
  disposedRef: MutableRefObject<boolean>;
  traceRef?: MutableRefObject<TraceRun | null>;
};

// Reads the controller at unmount on purpose: it is the turn in flight then.
// A turn in flight closes its own Trace as it settles; one parked on an
// action the athlete never answered is closed here.
const stopTurn = ({ abortRef, disposedRef, traceRef }: Refs): void => {
  disposedRef.current = true;
  if (abortRef.current) abortRef.current.abort();
  else if (traceRef) closeChatTrace(traceRef, "stopped");
};

/**
 * Leaving the conversation stops its turn, so it settles as `aborted` in the
 * conversation it started in instead of running on with no Stop control
 * while a second turn starts there. The returned flag also stops a resume
 * that starts after leaving, once its confirmed tool finishes.
 */
export const useStopTurnOnLeave = (
  abortRef: MutableRefObject<AbortController | null>,
  traceRef?: MutableRefObject<TraceRun | null>
): MutableRefObject<boolean> => {
  const disposedRef = useRef(false);
  useEffect(() => {
    disposedRef.current = false;
    return () => stopTurn({ abortRef, disposedRef, traceRef });
  }, [abortRef, traceRef]);
  return disposedRef;
};
