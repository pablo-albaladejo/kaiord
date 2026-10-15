import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

const PAUSE_MS = 800;

/**
 * Saves a text field after a pause in typing, or at once when it is left,
 * so a keystroke is never a write. A change still pending when the field
 * unmounts is saved then.
 */
export const usePromptAutosave = (
  save: (value: string) => Promise<boolean>
) => {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const latestSave = useRef(save);
  latestSave.current = save;
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const value = pending.current;
    if (value === null) return;
    pending.current = null;
    setStatus("saving");
    void latestSave
      .current(value)
      .then((ok) => setStatus(ok ? "saved" : "failed"));
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
