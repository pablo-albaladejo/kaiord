import { describe, expect, it } from "vitest";

import {
  INTEGRATION_REGISTRY,
  KNOWN_BRIDGE_IDS,
} from "../../integrations/integration-registry";
import type { ConnectionCredentials } from "../../lib/connections/connection-credentials";
import { createInMemoryConnectionRepository } from "../../test-utils/in-memory-connection-repository";
import { createConnectionProvider } from "./create-connection-provider";

const NOW = "2026-07-10T00:00:00.000Z";
const PROFILE_ID = "p1";

const noopCredentials: ConnectionCredentials = {
  encrypt: async (plaintext) => plaintext,
  decrypt: async (blob) => blob,
};

const setup = () => {
  const repository = createInMemoryConnectionRepository();
  const entry = INTEGRATION_REGISTRY.find((e) => e.id === "whoop");
  const provider = createConnectionProvider(
    "whoop",
    entry?.mechanism ?? "not-supported",
    { repository, credentials: noopCredentials, clock: () => NOW }
  );
  return { repository, provider };
};

describe("WHOOP connection (bridge mechanism)", () => {
  it("should register whoop as a bridge with the whoop-bridge id", () => {
    // Arrange
    const entry = INTEGRATION_REGISTRY.find((e) => e.id === "whoop");

    // Act
    const mechanism = entry?.mechanism;

    // Assert
    expect(mechanism).toBe("bridge");
    expect(entry?.bridgeId).toBe("whoop-bridge");
    expect(KNOWN_BRIDGE_IDS).toContain("whoop-bridge");
  });

  it("should mark whoop connected and persist the bridge record on connect", async () => {
    // Arrange
    const { repository, provider } = setup();

    // Act
    await provider.connect({ profileId: PROFILE_ID });

    // Assert
    const stored = await repository.get(PROFILE_ID, "whoop");
    expect(stored).toMatchObject({ status: "connected", mechanism: "bridge" });
    expect(stored?.credentialRef).toBeUndefined();
  });

  it("should clear the local linkage to disconnected on disconnect", async () => {
    // Arrange
    const { provider } = setup();
    await provider.connect({ profileId: PROFILE_ID });

    // Act
    await provider.disconnect(PROFILE_ID);

    // Assert
    expect(await provider.status(PROFILE_ID)).toBe("disconnected");
  });
});
