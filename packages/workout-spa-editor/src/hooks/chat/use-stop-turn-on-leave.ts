import { type MutableRefObject, useEffect, useRef } from "react";

type Refs = {
  abortRef: MutableRefObject<AbortController | null>;
  disposedRef: MutableRefObject<boolean>;
};

// Reads the controller at unmount on purpose: it is the turn in flight then.
const stopTurn = ({ abortRef, disposedRef }: Refs): void => {
  disposedRef.current = true;
  abortRef.current?.abort();
};

/**
 * Leaving the conversation stops its turn, so it settles as `aborted` in the
 * conversation it started in instead of running on with no Stop control
 * while a second turn starts there. The returned flag also stops a resume
 * that starts after leaving, once its confirmed tool finishes.
 */
export const useStopTurnOnLeave = (
  abortRef: MutableRefObject<AbortController | null>
): MutableRefObject<boolean> => {
  const disposedRef = useRef(false);
  useEffect(() => {
    disposedRef.current = false;
    return () => stopTurn({ abortRef, disposedRef });
  }, [abortRef]);
  return disposedRef;
};
