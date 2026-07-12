import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "./bridge-transport";
import { readWhoopFetch, WhoopBridgeError } from "./whoop-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const WHOOP_FETCH_TIMEOUT_MS = 30_000;

describe("readWhoopFetch", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should relay a whoop-fetch read and resolve with the relayed envelope", async () => {
    // Arrange
    const body = { records: [] };
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { ok: true, status: 200, data: body },
    });

    // Act
    const result = await readWhoopFetch("ext-123", "/cycles/details?id=7");

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-123",
      { action: "whoop-fetch", path: "/cycles/details?id=7" },
      WHOOP_FETCH_TIMEOUT_MS
    );
    expect(result).toEqual({ ok: true, status: 200, data: body });
  });

  it("should propagate a typed error carrying the bridge message", async () => {
    // Arrange
    const message =
      "No session token captured — open app.whoop.com and reload it.";
    mockedSend.mockResolvedValue({ ok: false, error: message });

    // Act
    const act = readWhoopFetch("ext-123", "/cycles/details");

    // Assert
    await expect(act).rejects.toBeInstanceOf(WhoopBridgeError);
    await expect(act).rejects.toThrow(message);
  });

  it("should reject a malformed bridge response envelope", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, protocolVersion: 1, data: 42 });

    // Act
    const act = readWhoopFetch("ext-123", "/cycles/details");

    // Assert
    await expect(act).rejects.toThrow("Malformed WHOOP bridge response");
  });
});
