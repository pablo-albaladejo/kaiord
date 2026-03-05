import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/secure-storage", () => {
  const store = new Map<string, string>();
  return {
    createSecureStorage: () => ({
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      remove: vi.fn((key: string) => store.delete(key)),
      has: vi.fn((key: string) => store.has(key)),
      clearAll: vi.fn(() => store.clear()),
      _store: store,
    }),
  };
});

import { createSecureStorage } from "../lib/secure-storage";
import { loadGarminData, persistGarminData } from "./garmin-store-persistence";

const mockStorage = createSecureStorage("test") as ReturnType<
  typeof createSecureStorage
> & { _store: Map<string, string> };

describe("garmin-store-persistence", () => {
  beforeEach(() => {
    mockStorage._store.clear();
  });

  it("should persist and load credentials round-trip", async () => {
    const data = {
      username: "user@test.com",
      password: "secret123",
      lambdaUrl: "https://custom.server.com/push",
    };

    await persistGarminData(data);
    const loaded = await loadGarminData();

    expect(loaded).toEqual(data);
  });

  it("should return empty data when nothing is stored", async () => {
    const loaded = await loadGarminData();

    expect(loaded.username).toBe("");
    expect(loaded.password).toBe("");
    expect(loaded.lambdaUrl).toBe("");
  });

  it("should return empty data on corrupt storage", async () => {
    mockStorage._store.set("garmin_credentials", "not-json");
    vi.mocked(mockStorage.get).mockRejectedValueOnce(new Error("decrypt fail"));

    const loaded = await loadGarminData();

    expect(loaded.username).toBe("");
    expect(loaded.password).toBe("");
  });
});
