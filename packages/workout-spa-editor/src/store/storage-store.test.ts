import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStorageStore } from "./storage-store";

describe("storage-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in the 'checking' status", () => {
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });

    expect(store.getState().status).toBe("checking");
  });

  it("transitions to 'ok' when the probe resolves 'complete'", async () => {
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });

    await store.getState().probe();

    expect(store.getState().status).toBe("ok");
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("transitions to 'failed' when the probe resolves 'failed'", async () => {
    const probe = vi.fn().mockResolvedValue("failed");
    const store = createStorageStore({ probe });

    await store.getState().probe();

    expect(store.getState().status).toBe("failed");
  });

  it("transitions to 'failed' when the probe throws", async () => {
    const probe = vi.fn().mockRejectedValue(new Error("boom"));
    const store = createStorageStore({ probe });

    await store.getState().probe();

    expect(store.getState().status).toBe("failed");
  });

  it("is idempotent — second call does not re-probe", async () => {
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });

    await store.getState().probe();
    await store.getState().probe();

    expect(probe).toHaveBeenCalledTimes(1);
    expect(store.getState().status).toBe("ok");
  });

  it("concurrent calls share the same in-flight probe", async () => {
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });

    await Promise.all([store.getState().probe(), store.getState().probe()]);

    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("exposes a stable status shape for subscribers", async () => {
    const probe = vi.fn().mockResolvedValue("failed");
    const store = createStorageStore({ probe });

    const observed: string[] = [];
    store.subscribe((state) => observed.push(state.status));

    await store.getState().probe();

    expect(observed[observed.length - 1]).toBe("failed");
  });
});
