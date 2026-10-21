import { useEffect, useState } from "react";

const TICK_MS = 1000;
const MS_PER_SECOND = 1000;

const secondsSince = (startedAt: number) =>
  Math.max(0, Math.floor((Date.now() - startedAt) / MS_PER_SECOND));

/** Whole seconds since `startedAt`, re-rendering once per second. */
export const useElapsedSeconds = (startedAt: number): number => {
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt));
  useEffect(() => {
    setSeconds(secondsSince(startedAt));
    const id = setInterval(() => setSeconds(secondsSince(startedAt)), TICK_MS);
    return () => clearInterval(id);
  }, [startedAt]);
  return seconds;
};
