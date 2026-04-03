import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./garmin-store-persistence", () => ({
  persistGarminData: vi.fn(),
  loadGarminData: vi.fn().mockResolvedValue({
    username: "saved@user.com",
    password: "saved-pass",
    lambdaUrl: "https://custom.server.com/push",
  }),
}));

import { persistGarminData, loadGarminData } from "./garmin-store-persistence";
import { createGarminActions } from "./garmin-store-actions";

const mockPersist = vi.mocked(persistGarminData);
const mockLoad = vi.mocked(loadGarminData);

type GarminState = {
  username: string;
  password: string;
  lambdaUrl: string;
  hydrated: boolean;
};

const DEFAULT_URL = "";

const createTestStore = () => {
  let state: GarminState = {
    username: "",
    password: "",
    lambdaUrl: DEFAULT_URL,
    hydrated: false,
  };

  const set = (
    fn: Partial<GarminState> | ((s: GarminState) => Partial<GarminState>)
  ) => {
    if (typeof fn === "function") {
      state = { ...state, ...fn(state) };
    } else {
      state = { ...state, ...fn };
    }
  };

  const get = () => state;
  const actions = createGarminActions(set, get, DEFAULT_URL);

  return { get, actions };
};

describe("createGarminActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hydrate", () => {
    it("should load data from persistence and set hydrated to true", async () => {
      const { get, actions } = createTestStore();

      await actions.hydrate();

      expect(mockLoad).toHaveBeenCalled();
      expect(get().username).toBe("saved@user.com");
      expect(get().password).toBe("saved-pass");
      expect(get().lambdaUrl).toBe("https://custom.server.com/push");
      expect(get().hydrated).toBe(true);
    });

    it("should use default URL when persisted lambdaUrl is empty", async () => {
      mockLoad.mockResolvedValueOnce({
        username: "u",
        password: "p",
        lambdaUrl: "",
      });
      const { get, actions } = createTestStore();

      await actions.hydrate();

      expect(get().lambdaUrl).toBe(DEFAULT_URL);
    });

  });

  describe("setCredentials", () => {
    it("should update username and password and persist", () => {
      const { get, actions } = createTestStore();

      actions.setCredentials("new@user.com", "new-pass");

      expect(get().username).toBe("new@user.com");
      expect(get().password).toBe("new-pass");
      expect(mockPersist).toHaveBeenCalledWith({
        username: "new@user.com",
        password: "new-pass",
        lambdaUrl: DEFAULT_URL,
      });
    });
  });

  describe("setLambdaUrl", () => {
    it("should update lambda URL and persist", () => {
      const { get, actions } = createTestStore();

      actions.setLambdaUrl("https://my.server.com/push");

      expect(get().lambdaUrl).toBe("https://my.server.com/push");
      expect(mockPersist).toHaveBeenCalled();
    });
  });

  describe("resetLambdaUrl", () => {
    it("should reset lambda URL to default and persist", () => {
      const { get, actions } = createTestStore();
      actions.setLambdaUrl("https://custom.com");

      actions.resetLambdaUrl();

      expect(get().lambdaUrl).toBe(DEFAULT_URL);
      expect(mockPersist).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearCredentials", () => {
    it("should clear username and password and persist", () => {
      const { get, actions } = createTestStore();
      actions.setCredentials("u", "p");

      actions.clearCredentials();

      expect(get().username).toBe("");
      expect(get().password).toBe("");
      expect(mockPersist).toHaveBeenCalled();
    });
  });
});
