import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "./bridge-transport";
import { readWhoopUserId } from "./whoop-user-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const USER_ID = 12_345;

describe("readWhoopUserId", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should read the WHOOP id from the read made before an import", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { userId: USER_ID },
    });

    // Act
    const userId = await readWhoopUserId("ext");

    // Assert
    expect(userId).toBe(USER_ID);
    expect(mockedSend.mock.calls[0][1]).toEqual({ action: "read-user-id" });
  });

  it("should answer no id when the extension holds no captured session", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      protocolVersion: 1,
      error: "no session token captured — open app.whoop.com and reload it",
    });

    // Act
    const userId = await readWhoopUserId("ext");

    // Assert
    expect(userId).toBeNull();
  });

  it("should fall back to an older extension's status, which still carries the id", async () => {
    // Arrange
    mockedSend
      .mockResolvedValueOnce({
        ok: false,
        protocolVersion: 1,
        error: "Origin or action not permitted",
      })
      .mockResolvedValueOnce({
        ok: true,
        protocolVersion: 1,
        data: { connected: true, userId: USER_ID, capturedAt: null },
      });

    // Act
    const userId = await readWhoopUserId("ext");

    // Assert
    expect(userId).toBe(USER_ID);
    expect(mockedSend.mock.calls[1][1]).toEqual({ action: "status" });
  });

  it("should throw when the extension did not answer", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      delivered: false,
      error: "Extension did not respond",
    });

    // Act
    const attempt = readWhoopUserId("ext");

    // Assert
    await expect(attempt).rejects.toMatchObject({ delivered: false });
  });
});
