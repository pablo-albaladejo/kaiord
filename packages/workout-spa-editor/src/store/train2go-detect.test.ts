/**
 * train2go-detect — TRANSPORT detection only.
 *
 * After train2go-profile-link, detection MUST NOT mutate any profile's
 * linkedAccounts. It only toggles extensionInstalled / sessionActive /
 * lastError / lastDetectionTimestamp. userId / userName from a ping
 * response are IGNORED here — they belong to the explicit connect flow.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDetectAction } from "./train2go-detect";
import { ping } from "./train2go-extension-transport";

vi.mock("./train2go-extension-transport", () => ({ ping: vi.fn() }));
const mockPing = vi.mocked(ping);

describe("createDetectAction", () => {
  let state: Record<string, unknown>;
  let set: (partial: Record<string, unknown>) => void;
  let get: () => Record<string, unknown>;
  let detect: () => Promise<void>;

  beforeEach(() => {
    state = {
      extensionInstalled: false,
      sessionActive: false,
      lastError: null,
      lastDetectionTimestamp: null,
    };
    set = (partial) => Object.assign(state, partial);
    get = () => state;
    detect = createDetectAction(
      set as never,
      get as never,
      () => "test-ext-id"
    );
    vi.clearAllMocks();
  });

  it("should set extensionInstalled + sessionActive on successful ping", async () => {
    // Arrange
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      sessionActive: true,
      externalUserId: "28035",
      externalUserName: "Pablo",
    });

    // Act
    await detect();

    // Assert
    expect(state.extensionInstalled).toBe(true);
    expect(state.sessionActive).toBe(true);
  });

  it("should do NOT write any user identity field to the store (anti-auto-link)", async () => {
    // Arrange
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      sessionActive: true,
      externalUserId: "28035",
      externalUserName: "Pablo",
    });

    // Act
    await detect();

    // Assert
    expect("userId" in state).toBe(false);
    expect("userName" in state).toBe(false);
  });

  it("should set not installed when ping fails", async () => {
    // Arrange
    mockPing.mockResolvedValue({
      ok: false,
      sessionActive: false,
      externalUserId: null,
      externalUserName: null,
      error: "Not found",
    });

    // Act
    await detect();

    // Assert
    expect(state.extensionInstalled).toBe(false);
    expect(state.sessionActive).toBe(false);
  });

  it("should show update message on protocol mismatch", async () => {
    // Arrange
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 99,
      sessionActive: false,
      externalUserId: null,
      externalUserName: null,
    });

    // Act
    await detect();

    // Assert
    expect(state.extensionInstalled).toBe(true);
    expect(state.sessionActive).toBe(false);
    expect(state.lastError).toContain("Update");
  });

  it("should use detection cache within 30s", async () => {
    // Arrange
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      sessionActive: true,
      externalUserId: null,
      externalUserName: null,
    });
    await detect();
    expect(mockPing).toHaveBeenCalledTimes(1);

    // Act
    await detect();

    // Assert
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should skip detection when extension ID is empty", async () => {
    // Arrange
    const detectEmpty = createDetectAction(
      set as never,
      get as never,
      () => ""
    );

    // Act
    await detectEmpty();

    // Assert
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("should handle session expired (installed but inactive)", async () => {
    // Arrange
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      sessionActive: false,
      externalUserId: null,
      externalUserName: null,
    });

    // Act
    await detect();

    // Assert
    expect(state.extensionInstalled).toBe(true);
    expect(state.sessionActive).toBe(false);
  });

  describe("30s detection cache (spa-train2go-extension spec)", () => {
    const okPing = {
      ok: true,
      protocolVersion: 1,
      sessionActive: true,
      externalUserId: null,
      externalUserName: null,
    };

    it("should re-ping when the cached timestamp is older than 30s", async () => {
      // Arrange
      mockPing.mockResolvedValue(okPing);
      await detect();
      expect(mockPing).toHaveBeenCalledTimes(1);
      state.lastDetectionTimestamp =
        (state.lastDetectionTimestamp as number) - 31_000;

      // Act
      await detect();

      // Assert
      expect(mockPing).toHaveBeenCalledTimes(2);
    });

    it("should always ping when no detection has ever run (timestamp = null)", async () => {
      // Arrange
      mockPing.mockResolvedValue(okPing);
      expect(state.lastDetectionTimestamp).toBeNull();

      // Act
      await detect();

      // Assert
      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    it("should re-ping even within 30s when the cached result was 'not installed'", async () => {
      // Arrange
      mockPing.mockResolvedValue({
        ok: false,
        sessionActive: false,
        externalUserId: null,
        externalUserName: null,
        error: "nope",
      });
      await detect();
      expect(state.extensionInstalled).toBe(false);
      expect(mockPing).toHaveBeenCalledTimes(1);
      mockPing.mockResolvedValueOnce(okPing);

      // Act
      await detect();

      // Assert
      expect(mockPing).toHaveBeenCalledTimes(2);
    });

    it("should short-circuit without updating lastDetectionTimestamp", async () => {
      // Arrange
      mockPing.mockResolvedValue(okPing);
      await detect();
      const firstStamp = state.lastDetectionTimestamp;

      // Act
      await detect();

      // Assert
      expect(state.lastDetectionTimestamp).toBe(firstStamp);
    });
  });
});
