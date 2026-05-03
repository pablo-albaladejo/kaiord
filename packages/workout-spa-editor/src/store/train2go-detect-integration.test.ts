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
    // Match the Train2GoPingResult shape that the real `ping()` returns
    // after `toPingResult` mapping; the previous fixture leaked the
    // raw extension envelope, which used to "work" only because the
    // detection cache didn't read sessionActive.
    vi.mocked(ping).mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      sessionActive: true,
      externalUserId: "42",
      externalUserName: "Test",
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

  it("does NOT cache a negative result — re-detect after a transient sessionActive=false", async () => {
    vi.mocked(ping).mockResolvedValueOnce({
      ok: true,
      protocolVersion: 1,
      sessionActive: false,
      externalUserId: null,
      externalUserName: null,
    });
    vi.mocked(ping).mockResolvedValueOnce({
      ok: true,
      protocolVersion: 1,
      sessionActive: true,
      externalUserId: "42",
      externalUserName: "Test",
    });

    await detect();
    await detect();

    expect(ping).toHaveBeenCalledTimes(2);
    expect(state.sessionActive).toBe(true);
  });

  it("force: true bypasses the positive cache for an explicit re-check", async () => {
    await detect();

    await detect({ force: true });

    expect(ping).toHaveBeenCalledTimes(2);
  });
});
