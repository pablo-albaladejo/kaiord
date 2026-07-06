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

  it("should show train2go as a bridge connection now that it's in the registry", () => {
    // Arrange

    // Act
    const train2go = CONNECTIONS.find((c) => c.id === "train2go");

    // Assert
    expect(train2go?.mechanism).toBe("bridge");
    expect(train2go?.bridgeId).toBe("train2go-bridge");
  });

  it("should declare trainingpeaks as an aspirational not-supported provider", () => {
    // Arrange

    // Act

    // Assert
    expect(mechanismOf("trainingpeaks")).toBe("not-supported");
  });

  it("should exclude manual entry — it has no connect/disconnect UI on this page", () => {
    // Arrange

    // Act
    const manual = CONNECTIONS.find((c) => c.id === "manual");

    // Assert
    expect(manual).toBeUndefined();
  });

  it("should identify WHOOP by its bridge id (flows are derived elsewhere, not stored here)", () => {
    // Arrange
    const whoop = CONNECTIONS.find((connection) => connection.id === "whoop");

    // Act

    // Assert
    expect(whoop?.bridgeId).toBe("whoop-bridge");
    expect(whoop).not.toHaveProperty("flows");
  });

  it("should give every catalog entry a mechanism", () => {
    // Arrange

    // Act
    const missing = CONNECTIONS.filter((c) => c.mechanism === undefined);

    // Assert
    expect(missing).toEqual([]);
  });
});
