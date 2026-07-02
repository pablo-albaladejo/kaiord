import { describe, expect, it } from "vitest";

import { CONNECTIONS } from "./connection-config";

const mechanismOf = (id: string) =>
  CONNECTIONS.find((connection) => connection.id === id)?.mechanism;

describe("CONNECTIONS catalog", () => {
  it("should declare the connect mechanism for each current provider", () => {
    // Arrange

    // Act

    // Assert
    expect(mechanismOf("garmin")).toBe("bridge");
    expect(mechanismOf("whoop")).toBe("bridge");
    expect(mechanismOf("intervals")).toBe("api-key");
    expect(mechanismOf("strava")).toBe("not-supported");
    expect(mechanismOf("wahoo")).toBe("not-supported");
  });

  it("should route WHOOP readiness and sleep imports to health data types", () => {
    // Arrange
    const whoop = CONNECTIONS.find((connection) => connection.id === "whoop");

    // Act
    const flows = whoop?.flows ?? [];

    // Assert
    expect(whoop?.bridgeId).toBe("whoop-bridge");
    expect(flows).toEqual([
      expect.objectContaining({ dataType: "hrv", direction: "import" }),
      expect.objectContaining({ dataType: "sleep", direction: "import" }),
    ]);
  });

  it("should give every catalog entry a mechanism", () => {
    // Arrange

    // Act
    const missing = CONNECTIONS.filter((c) => c.mechanism === undefined);

    // Assert
    expect(missing).toEqual([]);
  });
});
