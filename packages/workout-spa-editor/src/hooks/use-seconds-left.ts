/**
 * The whole seconds left until `until` (epoch ms), re-rendering once a
 * second until it reaches 0. `undefined` or a past instant is 0.
 */
import { useEffect, useState } from "react";

const MS_PER_SECOND = 1000;

const secondsUntil = (until: number | undefined) =>
  until === undefined
    ? 0
    : Math.max(0, Math.ceil((until - Date.now()) / MS_PER_SECOND));

export const useSecondsLeft = (until: number | undefined): number => {
  const [seconds, setSeconds] = useState(() => secondsUntil(until));
  useEffect(() => {
    setSeconds(secondsUntil(until));
    if (secondsUntil(until) === 0) return undefined;
    const timer = setInterval(() => {
      const left = secondsUntil(until);
      setSeconds(left);
      if (left === 0) clearInterval(timer);
    }, MS_PER_SECOND);
    return () => clearInterval(timer);
  }, [until]);
  return seconds;
};
