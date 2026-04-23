/**
 * overlayObserver (§7.4) contract:
 *   - `subscribe(rootEl, cb)` delivers the *initial* open-overlay count
 *     synchronously, then subsequent counts whenever the count changes.
 *   - Only open overlays (`[role="dialog"][data-state="open"]` or
 *     `[role="menu"][data-state="open"]`) that also carry a `data-radix-*`
 *     attribute AND live inside `rootEl` are counted. A foreign overlay
 *     injected elsewhere in the document MUST NOT trigger the guard —
 *     this is the availability-DoS mitigation called out by the spec.
 *   - A single ref-counted singleton serves all subscriptions. The last
 *     unsubscribe disconnects the underlying MutationObserver. In test
 *     builds the singleton is mirrored on
 *     `globalThis.__kaiord_overlayObserver__` so that Vitest's module
 *     reset cycle across files shares a single reference;
 *     `__resetOverlayObserverForTests()` tears it down.
 *   - When `MutationObserver` is not available the observer assumes
 *     zero overlays, emits exactly one dev-mode warning, and does not
 *     throw.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetOverlayObserverForTests,
  subscribeToOverlayCount,
} from "./overlay-observer";

const makeRoot = () => {
  const root = document.createElement("div");
  root.setAttribute("data-testid", "editor-root");
  document.body.appendChild(root);
  return root;
};

const makeOverlay = (
  role: "dialog" | "menu",
  state: "open" | "closed" = "open",
  radixAttr = "data-radix-popper-content-wrapper"
) => {
  const el = document.createElement("div");
  el.setAttribute("role", role);
  el.setAttribute("data-state", state);
  el.setAttribute(radixAttr, "");
  return el;
};

describe("subscribeToOverlayCount", () => {
  afterEach(() => {
    __resetOverlayObserverForTests();
    document.body.innerHTML = "";
  });

  it("delivers the initial count synchronously", () => {
    // Arrange
    const root = makeRoot();
    root.appendChild(makeOverlay("dialog"));
    const cb = vi.fn();

    // Act
    subscribeToOverlayCount(root, cb);

    // Assert — first call is the initial count.
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(1);
  });

  it("updates the count when an overlay opens inside the root", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();

    // Act — add an open dialog under the root.
    root.appendChild(makeOverlay("dialog"));
    await Promise.resolve(); // let the MutationObserver flush
    await Promise.resolve();

    // Assert
    expect(cb).toHaveBeenCalledWith(1);
  });

  it("does not fire for an overlay outside the root (DoS mitigation)", async () => {
    // Arrange — foreign overlay lives under body, not under our root.
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();
    const foreign = makeOverlay("dialog");
    document.body.appendChild(foreign);
    await Promise.resolve();
    await Promise.resolve();

    // Assert — count stays at 0; foreign overlay is ignored.
    for (const [count] of cb.mock.calls) {
      expect(count).toBe(0);
    }
  });

  it("ignores overlays without a data-radix-* attribute", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();

    // Act — add a dialog without any data-radix-* attribute.
    const plain = document.createElement("div");
    plain.setAttribute("role", "dialog");
    plain.setAttribute("data-state", "open");
    root.appendChild(plain);
    await Promise.resolve();
    await Promise.resolve();

    // Assert — not counted.
    for (const [count] of cb.mock.calls) {
      expect(count).toBe(0);
    }
  });

  it("fires once when closing the last overlay", async () => {
    // Arrange
    const root = makeRoot();
    const overlay = makeOverlay("dialog");
    root.appendChild(overlay);
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();

    // Act — transition the overlay to closed.
    overlay.setAttribute("data-state", "closed");
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(cb).toHaveBeenCalledWith(0);
  });

  it("deduplicates consecutive equal counts", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();

    // Act — add and remove a non-overlay element (no state change).
    const noise = document.createElement("span");
    root.appendChild(noise);
    await Promise.resolve();
    root.removeChild(noise);
    await Promise.resolve();

    // Assert — no redundant 0→0 callbacks.
    expect(cb).not.toHaveBeenCalled();
  });

  it("shares one observer across subscribers on the same root", async () => {
    // Arrange — two subscribers, both see the same transition.
    const root = makeRoot();
    const cbA = vi.fn();
    const cbB = vi.fn();
    subscribeToOverlayCount(root, cbA);
    subscribeToOverlayCount(root, cbB);
    cbA.mockClear();
    cbB.mockClear();

    // Act
    root.appendChild(makeOverlay("menu"));
    await Promise.resolve();
    await Promise.resolve();

    // Assert — both see the new count.
    expect(cbA).toHaveBeenCalledWith(1);
    expect(cbB).toHaveBeenCalledWith(1);
  });

  it("stops delivering after unsubscribe", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    const unsubscribe = subscribeToOverlayCount(root, cb);
    cb.mockClear();
    unsubscribe();

    // Act
    root.appendChild(makeOverlay("dialog"));
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(cb).not.toHaveBeenCalled();
  });

  describe("MutationObserver unavailable", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let originalMO: typeof globalThis.MutationObserver | undefined;

    beforeEach(() => {
      originalMO = globalThis.MutationObserver;
      // Simulate a legacy runtime.
      vi.stubGlobal("MutationObserver", undefined);
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      if (originalMO) globalThis.MutationObserver = originalMO;
      warnSpy.mockRestore();
    });

    it("calls back with 0, warns once, and does not throw", () => {
      // Arrange
      const root = makeRoot();
      const cbA = vi.fn();
      const cbB = vi.fn();

      // Act — two subscriptions, each should see 0, and the warning
      // must fire exactly once per process.
      const unsubA = subscribeToOverlayCount(root, cbA);
      const unsubB = subscribeToOverlayCount(root, cbB);

      // Assert
      expect(cbA).toHaveBeenCalledWith(0);
      expect(cbB).toHaveBeenCalledWith(0);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      // Cleanup (must be a function even in the fallback path).
      expect(() => unsubA()).not.toThrow();
      expect(() => unsubB()).not.toThrow();
    });
  });

  describe("singleton reset in test mode", () => {
    it("mirrors the singleton on globalThis in test env", () => {
      // Arrange
      const root = makeRoot();
      const cb = vi.fn();

      // Act
      subscribeToOverlayCount(root, cb);

      // Assert — test-only handle is defined in vitest.
      const globalKey = "__kaiord_overlayObserver__";
      expect((globalThis as Record<string, unknown>)[globalKey]).toBeDefined();
    });

    it("__resetOverlayObserverForTests disconnects and nulls the singleton", async () => {
      // Arrange
      const root = makeRoot();
      const cb = vi.fn();
      subscribeToOverlayCount(root, cb);
      const globalKey = "__kaiord_overlayObserver__";

      // Act
      __resetOverlayObserverForTests();

      // Assert
      expect(
        (globalThis as Record<string, unknown>)[globalKey]
      ).toBeUndefined();

      // And a fresh subscribe after reset works.
      cb.mockClear();
      subscribeToOverlayCount(root, cb);
      expect(cb).toHaveBeenCalled();
    });
  });
});
