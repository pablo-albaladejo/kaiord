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

  it("should deliver the initial count synchronously", () => {
    // Arrange
    const root = makeRoot();
    root.appendChild(makeOverlay("dialog"));
    const cb = vi.fn();

    // Act
    subscribeToOverlayCount(root, cb);

    // Assert
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(1);
  });

  it("should update the count when an overlay opens inside the root", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();
    root.appendChild(makeOverlay("dialog"));
    await Promise.resolve();

    // Act
    await Promise.resolve();

    // Assert
    expect(cb).toHaveBeenCalledWith(1);
  });

  it("should not fire for an overlay outside the root (DoS mitigation)", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();
    const foreign = makeOverlay("dialog");
    document.body.appendChild(foreign);
    await Promise.resolve();

    // Act
    await Promise.resolve();

    // Assert
    for (const [count] of cb.mock.calls) {
      expect(count).toBe(0);
    }
  });

  it("should ignore overlays without a data-radix-* attribute", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();
    const plain = document.createElement("div");
    plain.setAttribute("role", "dialog");
    plain.setAttribute("data-state", "open");
    root.appendChild(plain);
    await Promise.resolve();

    // Act
    await Promise.resolve();

    // Assert
    for (const [count] of cb.mock.calls) {
      expect(count).toBe(0);
    }
  });

  it("should fire once when closing the last overlay", async () => {
    // Arrange
    const root = makeRoot();
    const overlay = makeOverlay("dialog");
    root.appendChild(overlay);
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();
    overlay.setAttribute("data-state", "closed");
    await Promise.resolve();

    // Act
    await Promise.resolve();

    // Assert
    expect(cb).toHaveBeenCalledWith(0);
  });

  it("should deduplicate consecutive equal counts", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    subscribeToOverlayCount(root, cb);
    cb.mockClear();
    const noise = document.createElement("span");
    root.appendChild(noise);
    await Promise.resolve();
    root.removeChild(noise);

    // Act
    await Promise.resolve();

    // Assert
    expect(cb).not.toHaveBeenCalled();
  });

  it("should share one observer across subscribers on the same root", async () => {
    // Arrange
    const root = makeRoot();
    const cbA = vi.fn();
    const cbB = vi.fn();
    subscribeToOverlayCount(root, cbA);
    subscribeToOverlayCount(root, cbB);
    cbA.mockClear();
    cbB.mockClear();
    root.appendChild(makeOverlay("menu"));
    await Promise.resolve();

    // Act
    await Promise.resolve();

    // Assert
    expect(cbA).toHaveBeenCalledWith(1);
    expect(cbB).toHaveBeenCalledWith(1);
  });

  it("should stop delivering after unsubscribe", async () => {
    // Arrange
    const root = makeRoot();
    const cb = vi.fn();
    const unsubscribe = subscribeToOverlayCount(root, cb);
    cb.mockClear();
    unsubscribe();
    root.appendChild(makeOverlay("dialog"));
    await Promise.resolve();

    // Act
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

    it("should call back with 0, warns once, and does not throw", () => {
      // Arrange
      const root = makeRoot();
      const cbA = vi.fn();
      const cbB = vi.fn();
      const unsubA = subscribeToOverlayCount(root, cbA);

      // Act
      const unsubB = subscribeToOverlayCount(root, cbB);

      // Assert
      expect(cbA).toHaveBeenCalledWith(0);
      expect(cbB).toHaveBeenCalledWith(0);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(() => unsubA()).not.toThrow();
      expect(() => unsubB()).not.toThrow();
    });
  });

  describe("singleton reset in test mode", () => {
    it("should mirror the singleton on globalThis in test env", () => {
      // Arrange
      const root = makeRoot();
      const cb = vi.fn();
      subscribeToOverlayCount(root, cb);

      // Act
      const globalKey = "__kaiord_overlayObserver__";

      // Assert
      expect((globalThis as Record<string, unknown>)[globalKey]).toBeDefined();
    });

    it("should disconnect and null the singleton via __resetOverlayObserverForTests", async () => {
      // Arrange
      const root = makeRoot();
      const cb = vi.fn();
      subscribeToOverlayCount(root, cb);
      const globalKey = "__kaiord_overlayObserver__";
      __resetOverlayObserverForTests();
      expect(
        (globalThis as Record<string, unknown>)[globalKey]
      ).toBeUndefined();
      cb.mockClear();

      // Act
      subscribeToOverlayCount(root, cb);

      // Assert
      expect(cb).toHaveBeenCalled();
    });
  });
});
