import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBridgeConnectionStore } from "./bridge-connection-store";
import type { BridgeConnectionStore } from "./bridge-connection-types";
import type { SessionProbeResult } from "./bridge-session-probe-types";

// tanita-bridge is listed but deliberately has NO prober, mirroring
// production: its checkSession is a full CSV download and must not be polled.
const PROBED_BRIDGE_IDS = ["garmin-bridge", "whoop-bridge"];
const PROBELESS_BRIDGE_ID = "tanita-bridge";
const BRIDGE_IDS = [...PROBED_BRIDGE_IDS, PROBELESS_BRIDGE_ID];

const POLL_INTERVAL_MS = 300_000;
const POSITIVE_CACHE_MS = 30_000;
const HALF_CACHE_MS = 15_000;
const VISIBILITY_FLOOR_MS = 60_000;
const HALF_VISIBILITY_FLOOR_MS = 30_000;

const ACTIVE: SessionProbeResult = {
  sessionActive: true,
  error: null,
  needsReauth: false,
};
const INACTIVE: SessionProbeResult = {
  sessionActive: false,
  error: null,
  needsReauth: false,
};

type HarnessOptions = {
  result?: SessionProbeResult | Error;
  probeImpl?: () => Promise<SessionProbeResult>;
};

type Harness = {
  store: BridgeConnectionStore;
  probe: ReturnType<typeof vi.fn>;
  ids: Map<string, string>;
  notifyDiscovery: () => void;
  clock: { value: number };
};

const createHarness = (options: HarnessOptions = {}): Harness => {
  const result = options.result ?? ACTIVE;
  const clock = { value: 1_000 };
  const ids = new Map<string, string>();
  const discoveryListeners = new Set<() => void>();
  const probe = vi.fn(
    options.probeImpl ??
      (async () => {
        if (result instanceof Error) throw result;
        return result;
      })
  );
  const store = createBridgeConnectionStore({
    bridgeIds: BRIDGE_IDS,
    probes: Object.fromEntries(PROBED_BRIDGE_IDS.map((id) => [id, probe])),
    getExtensionId: (bridgeId) => ids.get(bridgeId) ?? null,
    subscribeDiscovery: (listener) => {
      discoveryListeners.add(listener);
      return () => discoveryListeners.delete(listener);
    },
    now: () => clock.value,
  });
  return {
    store,
    probe,
    ids,
    notifyDiscovery: () => discoveryListeners.forEach((l) => l()),
    clock,
  };
};

/** A prober the test releases by hand, for in-flight scenarios. */
const createGate = () => {
  let release: (result: SessionProbeResult) => void = () => undefined;
  const promise = new Promise<SessionProbeResult>((resolve) => {
    release = resolve;
  });
  return { promise, release: (r: SessionProbeResult) => release(r) };
};

const byId = (store: BridgeConnectionStore, bridgeId: string) =>
  store.getSnapshot().find((entry) => entry.bridgeId === bridgeId);

describe("createBridgeConnectionStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should report undiscovered bridges without probing them", async () => {
    // Arrange
    const h = createHarness();

    // Act
    await h.store.refresh();

    // Assert
    expect(h.probe).not.toHaveBeenCalled();
    expect(byId(h.store, "garmin-bridge")).toEqual({
      bridgeId: "garmin-bridge",
      discovered: false,
      sessionActive: false,
      checking: false,
      error: null,
      needsReauth: false,
      lastCheckedAt: null,
    });
  });

  it("should report a discovered bridge with no prober as discovered only", async () => {
    // Arrange
    const h = createHarness();
    h.ids.set(PROBELESS_BRIDGE_ID, "ext-t");

    // Act
    await h.store.refresh();

    // Assert
    expect(h.probe).not.toHaveBeenCalled();
    expect(byId(h.store, PROBELESS_BRIDGE_ID)).toEqual({
      bridgeId: PROBELESS_BRIDGE_ID,
      discovered: true,
      sessionActive: false,
      checking: false,
      error: null,
      needsReauth: false,
      lastCheckedAt: null,
    });
  });

  it("should probe a bridge once discovery reports its extension id", async () => {
    // Arrange
    const h = createHarness();
    await h.store.refresh();

    // Act
    h.ids.set("garmin-bridge", "ext-g");
    await h.store.refresh();

    // Assert
    expect(h.probe).toHaveBeenCalledWith("ext-g");
    expect(byId(h.store, "garmin-bridge")).toMatchObject({
      discovered: true,
      sessionActive: true,
      checking: false,
      lastCheckedAt: 1_000,
    });
  });

  it("should skip a re-probe inside the positive cache window", async () => {
    // Arrange
    const h = createHarness({ result: ACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    await h.store.refresh();

    // Act
    h.clock.value += HALF_CACHE_MS;
    await h.store.refresh();

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(1);
  });

  it("should re-probe a negative result inside the cache window", async () => {
    // Arrange
    const h = createHarness({ result: INACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    await h.store.refresh();

    // Act
    h.clock.value += HALF_CACHE_MS;
    await h.store.refresh();

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(2);
  });

  it("should re-probe once the positive cache window elapses", async () => {
    // Arrange
    const h = createHarness({ result: ACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    await h.store.refresh();

    // Act
    h.clock.value += POSITIVE_CACHE_MS;
    await h.store.refresh();

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(2);
  });

  it("should bypass the positive cache when force is set", async () => {
    // Arrange
    const h = createHarness({ result: ACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    await h.store.refresh();

    // Act
    await h.store.refresh({ force: true });

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(2);
  });

  it("should skip a bridge whose probe is already in flight", async () => {
    // Arrange
    const gate = createGate();
    const h = createHarness({ probeImpl: () => gate.promise });
    h.ids.set("garmin-bridge", "ext-g");
    const inFlight = h.store.refresh();

    // Act
    await h.store.refresh({ force: true });

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(1);
    gate.release(INACTIVE);
    await inFlight;
  });

  it("should not resurrect a bridge that disappeared mid-probe", async () => {
    // Arrange
    const gate = createGate();
    const h = createHarness({ probeImpl: () => gate.promise });
    h.ids.set("garmin-bridge", "ext-g");
    const inFlight = h.store.refresh();

    // Act
    h.ids.delete("garmin-bridge");
    gate.release(ACTIVE);
    await inFlight;

    // Assert
    expect(byId(h.store, "garmin-bridge")).toEqual({
      bridgeId: "garmin-bridge",
      discovered: false,
      sessionActive: false,
      checking: false,
      error: null,
      needsReauth: false,
      lastCheckedAt: null,
    });
  });

  it("should drop a probe result whose extension was swapped mid-flight", async () => {
    // Arrange
    const gate = createGate();
    const h = createHarness({ probeImpl: () => gate.promise });
    h.ids.set("garmin-bridge", "ext-old");
    const inFlight = h.store.refresh();

    // Act
    h.ids.set("garmin-bridge", "ext-new");
    gate.release(ACTIVE);
    await inFlight;

    // Assert
    expect(byId(h.store, "garmin-bridge")).toMatchObject({
      discovered: true,
      sessionActive: false,
      checking: false,
      lastCheckedAt: null,
    });
  });

  it("should fold a throwing prober into an inactive entry", async () => {
    // Arrange
    const h = createHarness({ result: new Error("probe exploded") });
    h.ids.set("garmin-bridge", "ext-g");

    // Act
    await h.store.refresh();

    // Assert
    expect(byId(h.store, "garmin-bridge")).toMatchObject({
      discovered: true,
      sessionActive: false,
      checking: false,
      error: "probe exploded",
    });
  });

  it("should carry a prober error and its reauth flag into the entry", async () => {
    // Arrange
    const h = createHarness({
      result: {
        sessionActive: false,
        error: "Session expired",
        needsReauth: true,
      },
    });
    h.ids.set("garmin-bridge", "ext-g");

    // Act
    await h.store.refresh();

    // Assert
    expect(byId(h.store, "garmin-bridge")).toMatchObject({
      error: "Session expired",
      needsReauth: true,
    });
  });

  it("should keep a stable snapshot reference while nothing changes", async () => {
    // Arrange
    const h = createHarness();
    await h.store.refresh();

    // Act
    const first = h.store.getSnapshot();
    await h.store.refresh();

    // Assert
    expect(h.store.getSnapshot()).toBe(first);
  });

  it("should notify subscribers when an entry changes", async () => {
    // Arrange
    const h = createHarness();
    const listener = vi.fn();
    h.store.subscribe(listener);
    h.ids.set("garmin-bridge", "ext-g");

    // Act
    await h.store.refresh();

    // Assert
    expect(listener).toHaveBeenCalled();
  });

  it("should stop notifying after unsubscribe", async () => {
    // Arrange
    const h = createHarness();
    const listener = vi.fn();
    const unsubscribe = h.store.subscribe(listener);
    unsubscribe();
    h.ids.set("garmin-bridge", "ext-g");

    // Act
    await h.store.refresh();

    // Assert
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("bridge connection store lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should probe on start and again on every poll tick", async () => {
    // Arrange
    const h = createHarness({ result: INACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    h.store.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.probe).toHaveBeenCalledTimes(1);

    // Act
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(2);
    h.store.stop();
  });

  it("should install a single interval when start is called twice", async () => {
    // Arrange
    const h = createHarness({ result: INACTIVE });
    h.ids.set("garmin-bridge", "ext-g");

    // Act
    h.store.start();
    h.store.start();
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    // Assert
    // One boot refresh + one interval tick. A second interval would make 4.
    expect(h.probe).toHaveBeenCalledTimes(2);
    h.store.stop();
  });

  it("should refresh when a discovery announcement lands", async () => {
    // Arrange
    const h = createHarness({ result: INACTIVE });
    h.store.start();
    await vi.advanceTimersByTimeAsync(0);
    h.ids.set("whoop-bridge", "ext-w");

    // Act
    h.notifyDiscovery();
    await vi.advanceTimersByTimeAsync(0);

    // Assert
    expect(h.probe).toHaveBeenCalledWith("ext-w");
    h.store.stop();
  });

  it("should force a refresh when the document becomes visible after the floor", async () => {
    // Arrange
    const h = createHarness({ result: ACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    h.store.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.probe).toHaveBeenCalledTimes(1);

    // Act
    h.clock.value += VISIBILITY_FLOOR_MS;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);

    // Assert
    // Forced, so the 30s positive cache does not suppress it.
    expect(h.probe).toHaveBeenCalledTimes(2);
    h.store.stop();
  });

  it("should skip the visibility refresh inside the minimum interval", async () => {
    // Arrange
    const h = createHarness({ result: ACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    h.store.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.probe).toHaveBeenCalledTimes(1);

    // Act
    h.clock.value += HALF_VISIBILITY_FLOOR_MS;
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);

    // Assert
    expect(h.probe).toHaveBeenCalledTimes(1);
    h.store.stop();
  });

  it("should clear the interval and the listeners on stop", async () => {
    // Arrange
    const h = createHarness({ result: INACTIVE });
    h.ids.set("garmin-bridge", "ext-g");
    h.store.start();
    await vi.advanceTimersByTimeAsync(0);
    h.store.stop();
    h.probe.mockClear();

    // Act
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    h.notifyDiscovery();
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);

    // Assert
    expect(h.probe).not.toHaveBeenCalled();
  });
});

describe("bridgeConnections singleton (HMR resilience)", () => {
  type GlobalShape = { __KAIORD_BRIDGE_CONNECTIONS__?: unknown };

  it("should be parked on globalThis after first evaluation", async () => {
    // Arrange
    const mod = await import("./bridge-connection-store");

    // Act
    const g = globalThis as unknown as GlobalShape;

    // Assert
    expect(g.__KAIORD_BRIDGE_CONNECTIONS__).toBe(mod.bridgeConnections);
  });

  it("should return the same instance on a fresh re-import", async () => {
    // Arrange
    const first = await import("./bridge-connection-store");
    vi.resetModules();

    // Act
    const second = await import("./bridge-connection-store");

    // Assert
    expect(second.bridgeConnections).toBe(first.bridgeConnections);
  });
});
