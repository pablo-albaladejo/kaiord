import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../../bridge/bridge-transport";
import { readWhoopUserId } from "./whoop-user-transport";

vi.mock("../../bridge/bridge-transport", () => ({
  sendBridgeMessage: vi.fn(),
}));

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
      protocolVersion: 2,
      data: { userId: USER_ID },
    });

    // Act
    const userId = await readWhoopUserId("ext");

    // Assert
    expect(userId).toBe(USER_ID);
    expect(mockedSend.mock.calls[0][1]).toEqual({ action: "read-user-id" });
  });

  it("should answer no id when the extension holds no sign-in", async () => {
    // Arrange
    mockedSend
      .mockResolvedValueOnce({
        ok: false,
        protocolVersion: 2,
        error: "no session token captured — open app.whoop.com and reload it",
      })
      .mockResolvedValueOnce({
        ok: true,
        protocolVersion: 2,
        data: { connected: false, session: "not-checked" },
      });

    // Act
    const userId = await readWhoopUserId("ext");

    // Assert
    expect(userId).toBeNull();
  });

  it("should say imports cannot run when the extension holds a sign-in with no account id", async () => {
    // Arrange
    mockedSend
      .mockResolvedValueOnce({
        ok: false,
        protocolVersion: 2,
        error: "no session token captured — open app.whoop.com and reload it",
      })
      .mockResolvedValueOnce({
        ok: true,
        protocolVersion: 2,
        data: { connected: true, session: "signed-in" },
      });

    // Act
    const attempt = readWhoopUserId("ext");

    // Assert
    await expect(attempt).rejects.toMatchObject({ reason: "no-account-id" });
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

  it("should tell an older extension by its protocol version, not by the words of its refusal", async () => {
    // Arrange
    mockedSend
      .mockResolvedValueOnce({
        ok: false,
        protocolVersion: 2,
        error: "Origin or action not permitted",
      })
      .mockResolvedValueOnce({
        ok: true,
        protocolVersion: 2,
        data: { connected: true, userId: USER_ID, capturedAt: 1 },
      });

    // Act
    const attempt = readWhoopUserId("ext");

    // Assert
    // An older extension's status id would be taken; the current one's
    // refusal means it holds none.
    await expect(attempt).rejects.toMatchObject({ reason: "no-account-id" });
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
