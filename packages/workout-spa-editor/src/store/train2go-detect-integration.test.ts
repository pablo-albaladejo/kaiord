/**
 * Integration: the 30s detection cache short-circuits re-entrant calls
 * from the Settings > Extensions Train2Go flow. Exercises the real
 * `createDetectAction` against a mocked transport.
 *
 * Acts as a regression-fence for the UX noted in spa-train2go-extension:
 * opening Settings twice in <30s must NOT emit two extension pings.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDetectAction } from "./train2go-detect";

vi.mock("./train2go-extension-transport", () => ({
  ping: vi.fn(),
}));

// eslint-disable-next-line simple-import-sort/imports
import { ping } from "./train2go-extension-transport";

describe("Train2Go detection cache — integration", () => {
  type State = {
    extensionInstalled: boolean;
    sessionActive: boolean;
    userId: number | null;
    userName: string | null;
    lastError: string | null;
    lastDetectionTimestamp: number | null;
  };

  let state: State;
  let detect: () => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      extensionInstalled: false,
      sessionActive: false,
      userId: null,
      userName: null,
      lastError: null,
      lastDetectionTimestamp: null,
    };
    const set = (p: Partial<State>) => Object.assign(state, p);
    const get = () => state;
    detect = createDetectAction(
      set as never,
      get as never,
      () => "train2go-ext-id"
    );
    vi.mocked(ping).mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { sessionActive: true, userId: 42, userName: "Test" },
    });
  });

  it("Settings opens twice in <30s — ping fires once", async () => {
    await detect();
    await detect();
    await detect();

    expect(ping).toHaveBeenCalledTimes(1);
    expect(state.extensionInstalled).toBe(true);
  });

  it("Settings re-opened after 30s — ping fires again", async () => {
    await detect();

    state.lastDetectionTimestamp =
      (state.lastDetectionTimestamp as number) - 30_001;
    await detect();

    expect(ping).toHaveBeenCalledTimes(2);
  });
});
