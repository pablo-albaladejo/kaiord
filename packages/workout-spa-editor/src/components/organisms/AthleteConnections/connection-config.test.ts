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
    expect(mechanismOf("intervals")).toBe("api-key");
    expect(mechanismOf("strava")).toBe("not-supported");
    expect(mechanismOf("wahoo")).toBe("not-supported");
  });

  it("should give every catalog entry a mechanism", () => {
    // Arrange

    // Act
    const missing = CONNECTIONS.filter((c) => c.mechanism === undefined);

    // Assert
    expect(missing).toEqual([]);
  });
});
