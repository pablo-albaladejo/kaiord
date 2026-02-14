import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";

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

import { getGarminClient, resetGarminClient } from "./garmin-client-state";
import { createGarminConnectClient } from "@kaiord/garmin-connect";

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
    const logger = createMockLogger();

    const client1 = getGarminClient(logger);
    const client2 = getGarminClient(logger);

    expect(client1).toBe(client2);
    expect(createGarminConnectClient).toHaveBeenCalledTimes(1);
  });

  it("should create new client after reset", () => {
    const logger = createMockLogger();

    const client1 = getGarminClient(logger);
    resetGarminClient();
    const client2 = getGarminClient(logger);

    expect(client1).not.toBe(client2);
    expect(createGarminConnectClient).toHaveBeenCalledTimes(2);
  });
});
