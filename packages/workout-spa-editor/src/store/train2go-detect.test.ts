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
    detect = createDetectAction(set as never, get as never, "test-ext-id");
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
    const detectEmpty = createDetectAction(set as never, get as never, "");

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
});
