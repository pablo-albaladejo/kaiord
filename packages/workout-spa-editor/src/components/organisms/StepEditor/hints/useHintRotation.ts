/**
 * useHintRotation Hook
 *
 * Manages automatic rotation of hints.
 */

import { useEffect, useState } from "react";
import { HINT_ROTATION_INTERVAL, HINTS } from "./constants";

export function useHintRotation(visible: boolean) {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % HINTS.length);
    }, HINT_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [visible]);

  return { currentHintIndex, currentHint: HINTS[currentHintIndex] };
}
