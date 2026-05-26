import type UPlotType from "uplot";
import { beforeAll, describe, expect, it, vi } from "vitest";

// uPlot's module body reads window.matchMedia at import time via setPxRatio.
// The shared `test-setup.ts` matchMedia mock is installed per `beforeEach`,
// which is too late for a top-level static import. Install a synchronous
// stub in `beforeAll` and dynamic-import uPlot afterwards.

type UPlotCtor = typeof UPlotType;

let UPlot: UPlotCtor;

beforeAll(async () => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
  // jsdom returns null from HTMLCanvasElement.prototype.getContext and lacks
  // Path2D. uPlot's raF-scheduled `_commit` then crashes during paint. Stub
  // both so the paint cycle is a no-op rather than a crash; the SyncPubSub
  // accounting we test runs synchronously during construct/destroy and is
  // independent of the paint cycle.
  if (typeof HTMLCanvasElement !== "undefined") {
    const noop = () => undefined;
    const ctx = new Proxy(
      {},
      {
        get: () => noop,
      }
    );
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      writable: true,
      value: vi.fn(() => ctx),
    });
  }
  if (typeof globalThis.Path2D === "undefined") {
    class Path2DStub {
      addPath(): void {}
      moveTo(): void {}
      lineTo(): void {}
      arc(): void {}
      closePath(): void {}
      rect(): void {}
    }
    (globalThis as { Path2D: typeof Path2DStub }).Path2D = Path2DStub;
  }
  const mod = await import("uplot");
  UPlot = mod.default;
});

describe("uPlot SyncPubSub membership", () => {
  it("should register an instance in uPlot.sync(key).plots when constructed with cursor.sync.key", () => {
    // Arrange
    const key = "trend-overlay-sync-test-a";
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Act
    const chart = new UPlot(
      {
        width: 1,
        height: 1,
        scales: { x: { time: false } },
        series: [{}, {}],
        cursor: { sync: { key } },
      },
      [
        [0, 1],
        [0, 1],
      ],
      container
    );

    // Assert
    expect(UPlot.sync(key).plots.length).toBe(1);

    // Cleanup
    chart.destroy();
    document.body.removeChild(container);
  });

  it("should drop a destroyed instance from uPlot.sync(key).plots", () => {
    // Arrange
    const key = "trend-overlay-sync-test-b";
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    document.body.append(c1, c2);
    const opts = {
      width: 1,
      height: 1,
      scales: { x: { time: false } },
      series: [{}, {}],
      cursor: { sync: { key } },
    } as const;
    const data: [number[], number[]] = [
      [0, 1],
      [0, 1],
    ];
    const u1 = new UPlot(opts, data, c1);
    const u2 = new UPlot(opts, data, c2);
    expect(UPlot.sync(key).plots.length).toBe(2);

    // Act
    u1.destroy();

    // Assert
    expect(UPlot.sync(key).plots.length).toBe(1);

    // Cleanup
    u2.destroy();
    document.body.removeChild(c1);
    document.body.removeChild(c2);
  });

  it("should clear all instances after every chart on a key is destroyed", () => {
    // Arrange
    const key = "trend-overlay-sync-test-c";
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    document.body.append(c1, c2);
    const opts = {
      width: 1,
      height: 1,
      scales: { x: { time: false } },
      series: [{}, {}],
      cursor: { sync: { key } },
    } as const;
    const data: [number[], number[]] = [
      [0, 1],
      [0, 1],
    ];
    const u1 = new UPlot(opts, data, c1);
    const u2 = new UPlot(opts, data, c2);

    // Act
    u1.destroy();
    u2.destroy();

    // Assert
    expect(UPlot.sync(key).plots.length).toBe(0);

    // Cleanup
    document.body.removeChild(c1);
    document.body.removeChild(c2);
  });
});
