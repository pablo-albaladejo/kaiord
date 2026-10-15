import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

const PAUSE_MS = 800;

/**
 * Saves a text field after a pause in typing, or at once when it is left,
 * so a keystroke is never a write. A change still pending when the field
 * unmounts is saved then.
 *
 * Only the latest save speaks: an older one landing late says nothing, and
 * "saved" shows only when no newer text is waiting. A failed value stays
 * pending, so leaving the field again retries it.
 */
export const usePromptAutosave = (
  save: (value: string) => Promise<boolean>
) => {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const latestSave = useRef(save);
  latestSave.current = save;
  const pending = useRef<string | null>(null);
  const lastRun = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const value = pending.current;
    if (value === null) return;
    const run = ++lastRun.current;
    setStatus("saving");
    void latestSave.current(value).then((ok) => {
      if (run !== lastRun.current) return;
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
  };

  useEffect(() => flush, [flush]);

  return { status, change, flush };
};
