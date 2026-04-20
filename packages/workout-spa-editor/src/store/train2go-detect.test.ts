import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDetectAction } from "./train2go-detect";

vi.mock("./train2go-extension-transport", () => ({
  ping: vi.fn(),
}));

import { ping } from "./train2go-extension-transport";

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
      userId: null,
      userName: null,
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

  it("sets extension installed on successful ping", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { sessionActive: true, userId: 123, userName: "Test" },
    });

    await detect();

    expect(state.extensionInstalled).toBe(true);
    expect(state.sessionActive).toBe(true);
    expect(state.userId).toBe(123);
    expect(state.userName).toBe("Test");
  });

  it("sets not installed when ping fails", async () => {
    mockPing.mockResolvedValue({ ok: false, error: "Not found" });

    await detect();

    expect(state.extensionInstalled).toBe(false);
    expect(state.sessionActive).toBe(false);
  });

  it("shows update message on protocol mismatch", async () => {
    mockPing.mockResolvedValue({ ok: true, protocolVersion: 99 });

    await detect();

    expect(state.extensionInstalled).toBe(true);
    expect(state.sessionActive).toBe(false);
    expect(state.lastError).toContain("Update");
  });

  it("uses detection cache within 30s", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { sessionActive: true, userId: 1, userName: "A" },
    });

    await detect();
    expect(mockPing).toHaveBeenCalledTimes(1);

    await detect();
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("skips detection when extension ID is empty", async () => {
    const detectEmpty = createDetectAction(
      set as never,
      get as never,
      () => ""
    );

    await detectEmpty();

    expect(mockPing).not.toHaveBeenCalled();
  });

  it("handles session expired (installed but inactive)", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { sessionActive: false },
    });

    await detect();

    expect(state.extensionInstalled).toBe(true);
    expect(state.sessionActive).toBe(false);
    expect(state.userId).toBeNull();
  });

  describe("30s detection cache (spa-train2go-extension spec)", () => {
    it("re-pings when the cached timestamp is older than 30s", async () => {
      mockPing.mockResolvedValue({
        ok: true,
        protocolVersion: 1,
        data: { sessionActive: true, userId: 1, userName: "A" },
      });

      await detect();
      expect(mockPing).toHaveBeenCalledTimes(1);

      // Age the cache entry past the 30s window.
      state.lastDetectionTimestamp =
        (state.lastDetectionTimestamp as number) - 31_000;
      await detect();

      expect(mockPing).toHaveBeenCalledTimes(2);
    });

    it("always pings when no detection has ever run (timestamp = null)", async () => {
      mockPing.mockResolvedValue({
        ok: true,
        protocolVersion: 1,
        data: { sessionActive: true, userId: 1, userName: "A" },
      });

      expect(state.lastDetectionTimestamp).toBeNull();

      await detect();

      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    it("re-pings even within 30s when the cached result was 'not installed'", async () => {
      mockPing.mockResolvedValue({ ok: false, error: "nope" });

      await detect();
      expect(state.extensionInstalled).toBe(false);
      expect(mockPing).toHaveBeenCalledTimes(1);

      // A subsequent detect() within 30s must retry because the cache
      // short-circuit only applies when extensionInstalled === true.
      mockPing.mockResolvedValueOnce({
        ok: true,
        protocolVersion: 1,
        data: { sessionActive: true },
      });

      await detect();

      expect(mockPing).toHaveBeenCalledTimes(2);
    });

    it("short-circuits without updating lastDetectionTimestamp", async () => {
      mockPing.mockResolvedValue({
        ok: true,
        protocolVersion: 1,
        data: { sessionActive: true },
      });

      await detect();
      const firstStamp = state.lastDetectionTimestamp;

      await detect();

      // The cache short-circuit returns before `set(...)` runs, so the
      // stamp stays pinned to the first detection. Verifies the
      // "rolling window" anti-pattern is NOT present.
      expect(state.lastDetectionTimestamp).toBe(firstStamp);
    });
  });
});
