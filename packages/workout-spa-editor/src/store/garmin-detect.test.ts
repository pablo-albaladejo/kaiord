import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminStore } from "./garmin-store";

vi.mock("./garmin-extension-transport", () => ({
  ping: vi.fn(),
}));

import { ping } from "./garmin-extension-transport";

import { createDetectAction } from "./garmin-detect";

const mockPing = vi.mocked(ping);

describe("createDetectAction", () => {
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let detectExtension: () => Promise<void>;
  let storeState: Partial<GarminStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    storeState = {
      lastDetectionTimestamp: null,
      extensionInstalled: false,
      detectExtension: vi.fn(),
    };

    set = vi.fn();
    get = vi.fn(() => storeState as GarminStore);
    detectExtension = createDetectAction(set, get, "ext-id");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should skip detection when cache is still valid", async () => {
    storeState.lastDetectionTimestamp = Date.now() - 10_000;
    storeState.extensionInstalled = true;

    await detectExtension();

    expect(mockPing).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("should detect when cache has expired", async () => {
    storeState.lastDetectionTimestamp = Date.now() - 31_000;
    storeState.extensionInstalled = true;
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: true } },
    });

    await detectExtension();

    expect(mockPing).toHaveBeenCalledWith("ext-id");
    expect(set).toHaveBeenCalled();
  });

  it("should detect when lastDetectionTimestamp is null", async () => {
    storeState.lastDetectionTimestamp = null;
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: true } },
    });

    await detectExtension();

    expect(mockPing).toHaveBeenCalledWith("ext-id");
  });

  it("should detect when extensionInstalled is false even if cache is fresh", async () => {
    storeState.lastDetectionTimestamp = Date.now() - 5_000;
    storeState.extensionInstalled = false;
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: true } },
    });

    await detectExtension();

    expect(mockPing).toHaveBeenCalledWith("ext-id");
  });

  it("should set extensionInstalled false when ping fails", async () => {
    mockPing.mockResolvedValue({ ok: false, error: "Not found" });

    await detectExtension();

    expect(set).toHaveBeenCalledWith({
      extensionInstalled: false,
      sessionActive: false,
      lastError: null,
      lastDetectionTimestamp: Date.now(),
    });
  });

  it("should set unsupported protocol error when version is not supported", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 999,
      data: { gcApi: { ok: true } },
    });

    await detectExtension();

    expect(set).toHaveBeenCalledWith({
      extensionInstalled: true,
      sessionActive: false,
      lastError: "Update your Kaiord Garmin Bridge extension",
      lastDetectionTimestamp: Date.now(),
    });
  });

  it("should set unsupported protocol error when protocolVersion is undefined", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      data: { gcApi: { ok: true } },
    });

    await detectExtension();

    expect(set).toHaveBeenCalledWith({
      extensionInstalled: true,
      sessionActive: false,
      lastError: "Update your Kaiord Garmin Bridge extension",
      lastDetectionTimestamp: Date.now(),
    });
  });

  it("should set sessionActive true when gcApi is ok", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: true } },
    });

    await detectExtension();

    expect(set).toHaveBeenCalledWith({
      extensionInstalled: true,
      sessionActive: true,
      lastError: null,
      lastDetectionTimestamp: Date.now(),
    });
  });

  it("should set sessionActive false when gcApi is not ok", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: false } },
    });

    await detectExtension();

    expect(set).toHaveBeenCalledWith({
      extensionInstalled: true,
      sessionActive: false,
      lastError: null,
      lastDetectionTimestamp: Date.now(),
    });
  });

  it("should set sessionActive false when data is undefined", async () => {
    mockPing.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
    });

    await detectExtension();

    expect(set).toHaveBeenCalledWith({
      extensionInstalled: true,
      sessionActive: false,
      lastError: null,
      lastDetectionTimestamp: Date.now(),
    });
  });
});
