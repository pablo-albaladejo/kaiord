import { afterEach, describe, expect, it, vi } from "vitest";

import {
  probeGarminSession,
  probeTrain2GoSession,
} from "./bridge-ping-session-probes";
import { sendBridgeMessage } from "./bridge-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const PING_TIMEOUT_MS = 2_000;

describe("probeGarminSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should report an active session when gcApi is ok", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { protocolVersion: 1, gcApi: { ok: true } },
    });

    // Act
    const result = await probeGarminSession("ext-1");

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-1",
      { action: "ping" },
      PING_TIMEOUT_MS
    );
    expect(result).toEqual({
      sessionActive: true,
      error: null,
      needsReauth: false,
    });
  });

  it("should report no session and no error when the ping envelope fails", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Extension not available",
    });

    // Act
    const result = await probeGarminSession("ext-1");

    // Assert
    expect(result).toEqual({
      sessionActive: false,
      error: null,
      needsReauth: false,
    });
  });

  it("should surface an update prompt on a protocol mismatch", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { protocolVersion: 2, gcApi: { ok: true } },
    });

    // Act
    const result = await probeGarminSession("ext-1");

    // Assert
    expect(result).toEqual({
      sessionActive: false,
      error: "Update your Kaiord Garmin Bridge extension",
      needsReauth: false,
    });
  });

  it("should report no session when gcApi is not ok", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { protocolVersion: 1, gcApi: { ok: false } },
    });

    // Act
    const result = await probeGarminSession("ext-1");

    // Assert
    expect(result.sessionActive).toBe(false);
  });
});

describe("probeTrain2GoSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should report an active session when sessionActive is true", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { protocolVersion: 1, sessionActive: true, userId: 42 },
    });

    // Act
    const result = await probeTrain2GoSession("ext-2");

    // Assert
    expect(result).toEqual({
      sessionActive: true,
      error: null,
      needsReauth: false,
    });
  });

  it("should report no session when sessionActive is false", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { protocolVersion: 1, sessionActive: false },
    });

    // Act
    const result = await probeTrain2GoSession("ext-2");

    // Assert
    expect(result.sessionActive).toBe(false);
    expect(result.error).toBeNull();
  });

  it("should name the Train2Go bridge in the update prompt", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { sessionActive: true },
    });

    // Act
    const result = await probeTrain2GoSession("ext-2");

    // Assert
    expect(result.error).toBe("Update your Kaiord Train2Go Bridge extension");
  });
});
