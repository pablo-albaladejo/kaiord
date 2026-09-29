/**
 * Step 0 (design §3.3): what makes placement impossible after Phase 1 —
 * no Web Locks (an insecure page, or a browser without them) or a bridge
 * without `calendar-write-v1`. Each is `library-only`, never `failed`.
 */
import type { PlacementResult } from "./placement-result";
import { CALENDAR_WRITE_FEATURE } from "./placement-timing";

type LibraryOnly = Extract<PlacementResult, { kind: "library-only" }>;

export const libraryOnlyReason = (deps: {
  locks: unknown;
  secureContext: boolean;
  features: readonly string[];
}): LibraryOnly | undefined => {
  if (!deps.locks)
    return {
      kind: "library-only",
      reason: deps.secureContext ? "unsupported-browser" : "insecure-context",
    };
  if (!deps.features.includes(CALENDAR_WRITE_FEATURE))
    return { kind: "library-only", reason: "bridge-outdated" };
  return undefined;
};
