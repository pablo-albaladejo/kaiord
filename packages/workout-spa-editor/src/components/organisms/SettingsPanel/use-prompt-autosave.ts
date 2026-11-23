import { useCallback, useEffect, useRef, useState } from "react";

import { registerPendingFlush } from "../../../lib/pending-flushes";

export type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

const PAUSE_MS = 800;

/**
 * Saves a text field after a pause in typing, or at once when it is left,
 * so a keystroke is never a write. A change still pending when the field
 * unmounts is saved then.
 *
 * Only the latest save speaks: an older one landing late says nothing, and
 * "saved" shows only when no newer text is waiting. A failed value stays
 * pending, so leaving the field again retries it; text already being saved
 * is not sent again. While a pause is running the save is registered as
 * pending, so an update to a new version saves it before reloading.
 */
export const usePromptAutosave = (
  save: (value: string) => Promise<boolean>
) => {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const latestSave = useRef(save);
  latestSave.current = save;
  const pending = useRef<string | null>(null);
  const lastRun = useRef(0);
  const inFlight = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const unregister = useRef<(() => void) | null>(null);

  const flush = useCallback((): Promise<void> | undefined => {
    clearTimeout(timer.current);
    unregister.current?.();
    unregister.current = null;
    const value = pending.current;
    // The same text already on its way is not written twice.
    if (value === null || value === inFlight.current) return;
    const run = ++lastRun.current;
    inFlight.current = value;
    setStatus("saving");
    return latestSave.current(value).then((ok) => {
      if (run !== lastRun.current) return;
      inFlight.current = null;
      const newerWaits = pending.current !== value;
      if (ok && !newerWaits) pending.current = null;
      if (newerWaits) setStatus("idle");
      else setStatus(ok ? "saved" : "failed");
    });
  }, []);

  const change = (value: string) => {
    pending.current = value;
    setStatus("idle");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, PAUSE_MS);
    unregister.current ??= registerPendingFlush(flush);
  };

  useEffect(
    () => () => {
      void flush();
    },
    [flush]
  );

  return { status, change, flush };
};
