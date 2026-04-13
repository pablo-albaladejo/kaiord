import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./train2go-extension-transport", () => ({
  readWeek: vi.fn(),
  readDay: vi.fn(),
  openTrain2Go: vi.fn(),
}));

vi.mock("./train2go-detect", () => ({
  createDetectAction: vi.fn(() => vi.fn()),
}));

import {
  readDay,
  readWeek,
  openTrain2Go,
} from "./train2go-extension-transport";
import { createTrain2GoActions } from "./train2go-store-actions";

const mockReadWeek = vi.mocked(readWeek);
const mockReadDay = vi.mocked(readDay);
const mockOpenTrain2Go = vi.mocked(openTrain2Go);

describe("train2go-store-actions", () => {
  let state: Record<string, unknown>;
  let set: (partial: Record<string, unknown>) => void;
  let get: () => Record<string, unknown>;

  beforeEach(() => {
    state = {
      extensionInstalled: true,
      sessionActive: true,
      userId: 42,
      userName: "Test",
      loading: false,
      lastError: null,
      activities: [],
    };
    set = (partial) => Object.assign(state, partial);
    get = () => state;
    vi.clearAllMocks();
  });

  describe("fetchWeek", () => {
    it("fetches activities for a week", async () => {
      mockReadWeek.mockResolvedValue({
        ok: true,
        data: {
          activities: [
            {
              id: 1,
              date: "2026-04-13",
              sport: "running",
              title: "Run",
              duration: "60min",
              workload: 3,
              status: 0,
            },
          ],
        },
      });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchWeek("2026-04-13");

      expect(state.loading).toBe(false);
      expect(state.activities).toHaveLength(1);
      expect(mockReadWeek).toHaveBeenCalledWith("ext-id", "2026-04-13", 42);
    });

    it("sets error when not connected (no userId)", async () => {
      state.userId = null;
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchWeek("2026-04-13");

      expect(state.lastError).toBe("Not connected to Train2Go");
      expect(mockReadWeek).not.toHaveBeenCalled();
    });

    it("handles session expired error", async () => {
      mockReadWeek.mockResolvedValue({ ok: false, error: "Session expired" });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchWeek("2026-04-13");

      expect(state.sessionActive).toBe(false);
      expect(state.lastError).toBe("Session expired");
      expect(state.loading).toBe(false);
    });

    it("handles generic error", async () => {
      mockReadWeek.mockResolvedValue({ ok: false, error: "Network error" });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchWeek("2026-04-13");

      expect(state.lastError).toBe("Network error");
      expect(state.loading).toBe(false);
    });

    it("uses fallback error message", async () => {
      mockReadWeek.mockResolvedValue({ ok: false });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchWeek("2026-04-13");

      expect(state.lastError).toBe("Read week failed");
    });

    it("defaults to empty activities when data is missing", async () => {
      mockReadWeek.mockResolvedValue({ ok: true });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchWeek("2026-04-13");

      expect(state.activities).toEqual([]);
    });
  });

  describe("fetchDay", () => {
    it("merges day details into existing activities", async () => {
      state.activities = [
        {
          id: 1,
          date: "2026-04-13",
          sport: "running",
          title: "Run",
          duration: "60min",
          workload: 3,
          status: 0,
        },
        {
          id: 2,
          date: "2026-04-13",
          sport: "cycling",
          title: "Ride",
          duration: "90min",
          workload: 4,
          status: 0,
        },
      ];
      mockReadDay.mockResolvedValue({
        ok: true,
        data: {
          activities: [
            {
              id: 1,
              date: "2026-04-13",
              sport: "running",
              title: "Run",
              duration: "60min",
              workload: 3,
              status: 1,
              description: "Easy run",
              completion: 100,
            },
          ],
        },
      });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchDay("2026-04-13");

      const activities = state.activities as Array<Record<string, unknown>>;
      expect(activities[0].description).toBe("Easy run");
      expect(activities[0].completion).toBe(100);
      expect(activities[1].description).toBeUndefined();
    });

    it("does nothing when userId is null", async () => {
      state.userId = null;
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchDay("2026-04-13");

      expect(mockReadDay).not.toHaveBeenCalled();
    });

    it("does nothing when readDay fails", async () => {
      state.activities = [{ id: 1 }];
      mockReadDay.mockResolvedValue({ ok: false, error: "fail" });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchDay("2026-04-13");

      expect(state.activities).toEqual([{ id: 1 }]);
    });

    it("defaults to empty array when data.activities is missing", async () => {
      state.activities = [{ id: 1 }];
      mockReadDay.mockResolvedValue({ ok: true });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.fetchDay("2026-04-13");

      // merged with empty dayActivities means no matches, originals preserved
      expect(state.activities).toEqual([{ id: 1 }]);
    });
  });

  describe("openTrain2Go", () => {
    it("calls openTrain2Go transport", async () => {
      mockOpenTrain2Go.mockResolvedValue({ ok: true });
      const actions = createTrain2GoActions(
        set as never,
        get as never,
        "ext-id"
      );

      await actions.openTrain2Go();

      expect(mockOpenTrain2Go).toHaveBeenCalledWith("ext-id");
    });
  });
});
