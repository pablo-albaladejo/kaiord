import { describe, expect, it } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "./connection-source";
import { sourceFixUrl } from "./source-fix-link";

const source = (
  over: Partial<ConnectionSource> & { status: ConnectionSourceStatus }
): ConnectionSource => ({
  id: "whoop",
  name: "WHOOP",
  mark: "Wh",
  mechanism: "bridge",
  bridgeId: "whoop-bridge",
  bridgeDetected: true,
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...over,
});

describe("sourceFixUrl", () => {
  it("should send a signed-out WHOOP source to the page that signs it back in", () => {
    // Arrange
    const whoop = source({ status: "attention" });

    // Act
    const url = sourceFixUrl(whoop);

    // Assert
    expect(url).toBe("https://app.whoop.com/");
  });

  // Every other status has its fix somewhere else, and a link to the
  // provider's site would not perform it. `available` is the one that would
  // hurt: its fix is the card's own Reconnect, or installing an extension the
  // provider's own site does not hand out.
  it.each([
    { status: "connected" as const },
    { status: "installed" as const },
    { status: "checking" as const },
    { status: "available" as const },
    { status: "manual" as const },
    { status: "unsupported" as const },
  ])("should offer no link while the source is $status", ({ status }) => {
    // Arrange
    const whoop = source({ status });

    // Act
    const url = sourceFixUrl(whoop);

    // Assert
    expect(url).toBeNull();
  });

  // The reachable regression this guards: adding a source to the map without
  // proving its URL. An unknown bridge in `attention` must render nothing
  // rather than borrow another source's destination.
  it("should offer no link for a source whose fix surface is not proven", () => {
    // Arrange
    const garmin = source({
      id: "garmin",
      name: "Garmin",
      bridgeId: "garmin-bridge",
      status: "attention",
    });

    // Act
    const url = sourceFixUrl(garmin);

    // Assert
    expect(url).toBeNull();
  });

  it("should offer no link for a source that has no bridge at all", () => {
    // Arrange
    const intervals = source({
      id: "intervals",
      name: "intervals.icu",
      mechanism: "api-key",
      bridgeId: null,
      status: "attention",
    });

    // Act
    const url = sourceFixUrl(intervals);

    // Assert
    expect(url).toBeNull();
  });
});
