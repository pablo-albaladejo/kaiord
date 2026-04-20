import { describe, expect, it } from "vitest";

import type { BridgeStatus } from "./bridge-types";

// Exhaustiveness guard: every BridgeStatus must be handled here. If the
// union ever adds a new member (or removes "removed"), the `assertNever`
// call fails at compile time.
function assertNever(x: never): never {
  throw new Error(`Unhandled BridgeStatus: ${x as string}`);
}

function bridgeStatusLabel(status: BridgeStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "unavailable":
      return "Unavailable";
    case "removed":
      return "Removed";
    default:
      return assertNever(status);
  }
}

describe("BridgeStatus exhaustiveness", () => {
  it("includes 'removed' as a first-class state", () => {
    const s: BridgeStatus = "removed";

    expect(bridgeStatusLabel(s)).toBe("Removed");
  });

  it("handles 'verified' and 'unavailable' too", () => {
    expect(bridgeStatusLabel("verified")).toBe("Verified");
    expect(bridgeStatusLabel("unavailable")).toBe("Unavailable");
  });
});
