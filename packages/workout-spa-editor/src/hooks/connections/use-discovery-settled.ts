/**
 * Whether a count of detected bridges is worth rendering yet.
 *
 * The question is not "have we asked" — nobody asks, extensions announce
 * themselves — but "has discovery had its chance". A refresh pass is not that
 * signal: over a browser where nothing has announced it settles on the next
 * microtask, long before any extension could answer, which would render a
 * confident "0 of 5" to a fully equipped reader.
 *
 *   - Any bridge detected ends it immediately. That is positive evidence that
 *     announcements are arriving, and the count is explicitly of what has
 *     answered so far this page-life: it climbs in step with the cards beside
 *     it, each of which flips as its own announcement verifies.
 *   - Otherwise the window is the discover request's own delay plus the
 *     ceiling on the verification ping that answers it. Both are derived from
 *     the constants that govern them, so this cannot drift from the behaviour
 *     it is waiting on.
 */
import { useEffect, useState } from "react";

import { DISCOVER_REQUEST_DELAY_MS } from "../../adapters/bridge/bridge-discovery";
import { PING_TIMEOUT_MS } from "../../adapters/bridge/bridge-transport";
import { discoveryStartedAt } from "../discovery-clock";

export const DISCOVERY_SETTLE_MS = DISCOVER_REQUEST_DELAY_MS + PING_TIMEOUT_MS;

export const useDiscoverySettled = (detected: number): boolean => {
  const [, retick] = useState(0);
  const startedAt = discoveryStartedAt();
  const settled = detected > 0 || Date.now() - startedAt >= DISCOVERY_SETTLE_MS;

  useEffect(() => {
    // Nothing else will wake this surface: with no extension present no row
    // ever changes, so the store's poll notifies no one and the placeholder
    // would outlive the window it stands for.
    if (settled) return;
    const remaining = startedAt + DISCOVERY_SETTLE_MS - Date.now();
    const timer = setTimeout(
      () => retick((n) => n + 1),
      Math.max(remaining, 0)
    );
    return () => clearTimeout(timer);
  }, [settled, startedAt]);

  return settled;
};
