import { describe, expect, it } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "../../../application/connections/connection-source";
import { detailKeyFor } from "./connection-card-copy";

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
  it("should explain a probed bridge that is installed as known only at first use", () => {
    // Arrange
    // A probed bridge reaches `installed` only when its check asked nothing;
    // the unprobed wording (about never re-checking) would be false for it.
    const unchecked = source("installed", { sessionVerifiable: true });

    // Act
    const key = detailKeyFor(unchecked);

    // Assert
    expect(key).toBe("detail.notChecked");
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
