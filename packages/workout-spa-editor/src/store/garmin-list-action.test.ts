import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminStore } from "./garmin-store";

vi.mock("./garmin-extension-transport", () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from "./garmin-extension-transport";

import { createListAction } from "./garmin-list-action";

const mockSendMessage = vi.mocked(sendMessage);

describe("createListAction", () => {
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let listWorkouts: () => Promise<unknown[]>;
  let detectExtension: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    detectExtension = vi.fn();
    set = vi.fn();
    get = vi.fn(
      () =>
        ({
          detectExtension,
        }) as unknown as GarminStore
    );
    listWorkouts = createListAction(set, get, "ext-id");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send message with list action", async () => {
    mockSendMessage.mockResolvedValue({
      ok: true,
      data: [{ id: 1 }],
    });

    await listWorkouts();

    expect(mockSendMessage).toHaveBeenCalledWith(
      "ext-id",
      { action: "list" },
      10_000
    );
  });

  it("should return data array on success", async () => {
    const workouts = [{ id: 1 }, { id: 2 }];
    mockSendMessage.mockResolvedValue({ ok: true, data: workouts });

    const result = await listWorkouts();

    expect(result).toStrictEqual(workouts);
  });

  it("should return empty array when data is not an array", async () => {
    mockSendMessage.mockResolvedValue({ ok: true, data: "not-an-array" });

    const result = await listWorkouts();

    expect(result).toStrictEqual([]);
  });

  it("should return empty array when data is undefined", async () => {
    mockSendMessage.mockResolvedValue({ ok: true });

    const result = await listWorkouts();

    expect(result).toStrictEqual([]);
  });

  it("should redetect and throw when extension context invalidated", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      error: "Extension context invalidated",
    });

    await expect(listWorkouts()).rejects.toThrow(
      "Extension was updated. Please try again."
    );
    expect(set).toHaveBeenCalledWith({ lastDetectionTimestamp: null });
    expect(detectExtension).toHaveBeenCalled();
  });

  it("should redetect on 401 status and throw", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      status: 401,
      error: "Unauthorized",
    });

    await expect(listWorkouts()).rejects.toThrow("Unauthorized");
    expect(set).toHaveBeenCalledWith({ lastDetectionTimestamp: null });
    expect(detectExtension).toHaveBeenCalled();
  });

  it("should redetect on 403 status and throw", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Forbidden",
    });

    await expect(listWorkouts()).rejects.toThrow("Forbidden");
    expect(detectExtension).toHaveBeenCalled();
  });

  it("should throw with fallback message when error is undefined", async () => {
    mockSendMessage.mockResolvedValue({ ok: false });

    await expect(listWorkouts()).rejects.toThrow("List failed");
  });

  it("should not redetect on non-401/403 error status", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      status: 500,
      error: "Server error",
    });

    await expect(listWorkouts()).rejects.toThrow("Server error");
    expect(detectExtension).not.toHaveBeenCalled();
  });

  it("should throw with specific error message from response", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      error: "Rate limited",
    });

    await expect(listWorkouts()).rejects.toThrow("Rate limited");
  });
});
