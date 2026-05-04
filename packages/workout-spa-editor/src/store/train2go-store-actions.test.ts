/**
 * train2go-store-actions tests.
 *
 * After train2go-profile-link the store no longer owns activity fetching.
 * fetchWeek/fetchDay logic moved to application/coaching/* use cases
 * (covered by use-cases.test.ts). Only `openTrain2Go` and `detectExtension`
 * remain on the store action surface — this file exercises the open path;
 * detection is covered by train2go-detect.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./train2go-extension-transport", () => ({
  openTrain2Go: vi.fn(),
}));

vi.mock("./train2go-detect", () => ({
  createDetectAction: vi.fn(() => vi.fn()),
}));

import { openTrain2Go } from "./train2go-extension-transport";
import { createTrain2GoActions } from "./train2go-store-actions";

const mockOpenTrain2Go = vi.mocked(openTrain2Go);

describe("train2go-store-actions", () => {
  let state: Record<string, unknown>;
  let set: (partial: Record<string, unknown>) => void;
  let get: () => Record<string, unknown>;

  beforeEach(() => {
    state = {
      extensionInstalled: true,
      sessionActive: true,
      loading: false,
      lastError: null,
      lastDetectionTimestamp: null,
    };
    set = (partial) => Object.assign(state, partial);
    get = () => state;
    vi.clearAllMocks();
  });

  it("should delegate to the transport with the extension id via openTrain2Go", async () => {
    mockOpenTrain2Go.mockResolvedValue({ ok: true });
    const actions = createTrain2GoActions(
      set as never,
      get as never,
      () => "ext-id"
    );

    await actions.openTrain2Go();

    expect(mockOpenTrain2Go).toHaveBeenCalledWith("ext-id");
  });

  it("should do NOT expose fetchWeek / fetchDay on the action surface", () => {
    const actions = createTrain2GoActions(
      set as never,
      get as never,
      () => "ext-id"
    );

    // Activity fetching moved to application use cases — verify the
    // store API stays minimal (transport only).
    expect("fetchWeek" in actions).toBe(false);
    expect("fetchDay" in actions).toBe(false);
  });
});
