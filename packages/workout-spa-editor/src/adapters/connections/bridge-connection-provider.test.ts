import { describe, expect, it } from "vitest";

import { createInMemoryConnectionRepository } from "../../test-utils/in-memory-connection-repository";
import { createBridgeConnectionProvider } from "./bridge-connection-provider";

const NOW = "2026-06-19T00:00:00.000Z";

const setup = () => {
  const repository = createInMemoryConnectionRepository();
  const provider = createBridgeConnectionProvider({
    providerId: "garmin",
    repository,
    clock: () => NOW,
  });
  return { repository, provider };
};

describe("createBridgeConnectionProvider", () => {
  it("should mark the bridge connected and persist the record", async () => {
    // Arrange
    const { repository, provider } = setup();

    // Act
    await provider.connect({ profileId: "p1" });

    // Assert
    const stored = await repository.get("p1", "garmin");
    expect(stored).toMatchObject({ status: "connected", mechanism: "bridge" });
  });

  it("should report disconnected before any connect", async () => {
    // Arrange
    const { provider } = setup();

    // Act
    const status = await provider.status("p1");

    // Assert
    expect(status).toBe("disconnected");
  });

  it("should clear the local linkage to disconnected on disconnect", async () => {
    // Arrange
    const { provider } = setup();
    await provider.connect({ profileId: "p1" });

    // Act
    await provider.disconnect("p1");

    // Assert
    expect(await provider.status("p1")).toBe("disconnected");
  });
});
