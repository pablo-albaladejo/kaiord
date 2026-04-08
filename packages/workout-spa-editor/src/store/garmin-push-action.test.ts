import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminStore } from "./garmin-store";

vi.mock("./garmin-extension-transport", () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from "./garmin-extension-transport";

import { createPushAction } from "./garmin-push-action";

const mockSendMessage = vi.mocked(sendMessage);

describe("createPushAction", () => {
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let pushWorkout: (gcn: unknown) => Promise<void>;
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
    pushWorkout = createPushAction(set, get, "ext-id");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set pushing to loading before sending", async () => {
    mockSendMessage.mockResolvedValue({ ok: true });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({ pushing: { status: "loading" } });
  });

  it("should send message with push action and gcn payload", async () => {
    const gcn = { workoutName: "test" };
    mockSendMessage.mockResolvedValue({ ok: true });

    await pushWorkout(gcn);

    expect(mockSendMessage).toHaveBeenCalledWith(
      "ext-id",
      { action: "push", gcn },
      15_000
    );
  });

  it("should set pushing to success on successful response", async () => {
    mockSendMessage.mockResolvedValue({ ok: true });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({ pushing: { status: "success" } });
  });

  it("should redetect and set error when extension context invalidated", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      error: "Extension context invalidated",
    });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({ lastDetectionTimestamp: null });
    expect(detectExtension).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      pushing: {
        status: "error",
        message: "Extension was updated. Please try again.",
      },
    });
  });

  it("should redetect on 401 status and set error", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      status: 401,
      error: "Unauthorized",
    });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({ lastDetectionTimestamp: null });
    expect(detectExtension).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      pushing: { status: "error", message: "Unauthorized" },
    });
  });

  it("should redetect on 403 status and set error", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Forbidden",
    });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({ lastDetectionTimestamp: null });
    expect(detectExtension).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      pushing: { status: "error", message: "Forbidden" },
    });
  });

  it("should set special message when extension did not respond", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      error: "Extension did not respond",
    });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({
      pushing: {
        status: "error",
        message:
          "Extension did not respond. Check Garmin Connect before retrying.",
      },
    });
  });

  it("should use generic error message on unknown failure", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      error: "Something went wrong",
    });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({
      pushing: { status: "error", message: "Something went wrong" },
    });
  });

  it("should use fallback message when error is undefined", async () => {
    mockSendMessage.mockResolvedValue({ ok: false });

    await pushWorkout({ workout: "data" });

    expect(set).toHaveBeenCalledWith({
      pushing: { status: "error", message: "Push failed" },
    });
  });

  it("should not redetect on non-401/403 error status", async () => {
    mockSendMessage.mockResolvedValue({
      ok: false,
      status: 500,
      error: "Server error",
    });

    await pushWorkout({ workout: "data" });

    expect(detectExtension).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      pushing: { status: "error", message: "Server error" },
    });
  });
});
