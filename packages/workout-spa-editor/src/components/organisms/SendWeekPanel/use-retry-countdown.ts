/**
 * Seconds until the earliest `retryAfter` still ahead, ticking once a
 * second; `undefined` when nothing waits, so "Retry" can enable.
 */
import { useEffect, useState } from "react";

import { nextRetryAt } from "../../../application/garmin-bulk/bulk-retry";
import type { BulkOutcome } from "../../../application/garmin-bulk/send-week-to-garmin";

const TICK_MS = 1000;

export function useRetryCountdown(
  outcomes: readonly BulkOutcome[]
): number | undefined {
  const [now, setNow] = useState(() => Date.now());
  const at = nextRetryAt(outcomes, now);
  useEffect(() => {
    if (at === undefined) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [at]);
  return at === undefined ? undefined : Math.ceil((at - now) / TICK_MS);
}
