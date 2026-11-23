import { describe, expect, it } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "../../../application/connections/connection-source";
import { detailKeyFor, notCheckedReasonFor } from "./connection-card-copy";

const source = (
  status: ConnectionSourceStatus,
  overrides: Partial<ConnectionSource> = {}
): ConnectionSource =>
  ({
    id: "garmin",
    mechanism: "bridge",
    bridgeId: "garmin-bridge",
    status,
    bridgeDetected: true,
    disconnected: false,
    connection: "working",
    ...overrides,
  }) as ConnectionSource;

describe("detailKeyFor", () => {
  // A probed bridge reaches `installed` only when its check asked nothing;
  // why it asked nothing is the shared notices' wording for its reason.
  it.each([
    ["garmin-bridge", "would-mint-token"],
    ["trainingpeaks-bridge", "would-mint-token"],
    ["whoop-bridge", "no-token-captured"],
  ] as const)(
    "should say why %s's check asked nothing by its own reason, %s",
    (bridgeId, reason) => {
      // Arrange
      const unchecked = source("installed", {
        bridgeId,
        sessionVerifiable: true,
      });

      // Act
      const said = [notCheckedReasonFor(unchecked), detailKeyFor(unchecked)];

      // Assert
      expect(said).toEqual([reason, null]);
    }
  );

  it("should give a Tanita extension whose check would download the export its own not-checked reason", () => {
    // Arrange
    const unchecked = source("installed", {
      bridgeId: "tanita-bridge",
      sessionVerifiable: true,
    });

    // Act
    const said = [notCheckedReasonFor(unchecked), detailKeyFor(unchecked)];

    // Assert
    expect(said).toEqual(["would-download-data", null]);
  });

  it("should keep the announced-on-load wording for a bridge with no prober", () => {
    // Arrange
    const unprobed = source("installed", { sessionVerifiable: false });

    // Act
    const key = detailKeyFor(unprobed);

    // Assert
    expect(key).toBe("detail.installed");
  });

  it.each(["outdated", "signed-out", "not-answering"] as const)(
    "should leave a %s Connection's words to its notice, with no detail line",
    (connection) => {
      // Arrange
      const broken = source("attention", { connection });

      // Act
      const key = detailKeyFor(broken);

      // Assert
      expect(key).toBeNull();
    }
  );

  it("should leave an absent extension to its Install notice rather than say disconnected", () => {
    // Arrange
    // Both are true of a source the user unlinked and then uninstalled; the
    // blocking one is the missing extension, which is the one with no control.
    const gone = source("available", {
      bridgeDetected: false,
      disconnected: true,
    });

    // Act
    const key = detailKeyFor(gone);

    // Assert
    expect(key).toBeNull();
  });
});
