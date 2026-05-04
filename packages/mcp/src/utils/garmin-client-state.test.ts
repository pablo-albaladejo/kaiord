import type { Logger } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@kaiord/garmin-connect", () => ({
  createGarminConnectClient: vi.fn(() => ({
    auth: { login: vi.fn(), logout: vi.fn() },
    service: { list: vi.fn(), push: vi.fn() },
  })),
  createMemoryTokenStore: vi.fn(() => ({
    save: vi.fn(),
    load: vi.fn(),
    clear: vi.fn(),
  })),
}));

import { createGarminConnectClient } from "@kaiord/garmin-connect";

import { getGarminClient, resetGarminClient } from "./garmin-client-state";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("garmin-client-state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGarminClient();
  });

  it("should create a singleton client", () => {
    // Arrange
    const logger = createMockLogger();
    const client1 = getGarminClient(logger);

    // Act
    const client2 = getGarminClient(logger);

    // Assert
    expect(client1).toBe(client2);
    expect(createGarminConnectClient).toHaveBeenCalledTimes(1);
  });

  it("should create new client after reset", () => {
    // Arrange
    const logger = createMockLogger();
    const client1 = getGarminClient(logger);
    resetGarminClient();

    // Act
    const client2 = getGarminClient(logger);

    // Assert
    expect(client1).not.toBe(client2);
    expect(createGarminConnectClient).toHaveBeenCalledTimes(2);
  });
});
