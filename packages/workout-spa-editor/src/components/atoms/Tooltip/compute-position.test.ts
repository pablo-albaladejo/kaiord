import { afterEach, describe, expect, it } from "vitest";

import type { Align, Side } from "./compute-position";
import { computeTooltipPosition } from "./compute-position";

// jsdom performs no layout, so `documentElement.clientWidth` is 0 and
// `computeTooltipPosition` falls back to `window.innerWidth`. Driving that is
// how these tests emulate a narrow screen.
const DEFAULT_INNER_WIDTH = window.innerWidth;

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
    writable: true,
  });
};

const makeRect = (r: Partial<DOMRect>) =>
  ({ ...r, toJSON: () => ({}) }) as DOMRect;

// Fixture: triggerRect at (200,100), size 80x30 -> right=280, bottom=130.
// Tooltip size 60x20. SIDE_OFFSET=5. jsdom default window.scrollX=scrollY=0.
const triggerRect = {
  top: 100,
  bottom: 130,
  left: 200,
  right: 280,
  width: 80,
  height: 30,
  x: 200,
  y: 100,
  toJSON: () => ({}),
} as DOMRect;

const tooltipRect = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  width: 60,
  height: 20,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

describe("computeTooltipPosition", () => {
  it.each<{ side: Side; align: Align; top: number; left: number }>([
    // top + align: top = 100 - 20 - 5 = 75
    { side: "top", align: "start", top: 75, left: 200 },
    { side: "top", align: "center", top: 75, left: 210 },
    { side: "top", align: "end", top: 75, left: 220 },
    // bottom + align: top = 130 + 5 = 135
    { side: "bottom", align: "start", top: 135, left: 200 },
    { side: "bottom", align: "center", top: 135, left: 210 },
    { side: "bottom", align: "end", top: 135, left: 220 },
    // left + align: left = 200 - 60 - 5 = 135
    { side: "left", align: "start", top: 100, left: 135 },
    { side: "left", align: "center", top: 105, left: 135 },
    { side: "left", align: "end", top: 110, left: 135 },
    // right + align: left = 280 + 5 = 285
    { side: "right", align: "start", top: 100, left: 285 },
    { side: "right", align: "center", top: 105, left: 285 },
    { side: "right", align: "end", top: 110, left: 285 },
  ])(
    "should compute position for side=$side align=$align",
    ({ side, align, top, left }) => {
      // Arrange

      // Act
      const result = computeTooltipPosition(
        triggerRect,
        tooltipRect,
        side,
        align
      );

      // Assert
      expect(result).toEqual({ top, left });
    }
  );
});

/**
 * Regression: an unclamped `side: "right"` coach mark rendered 125px past the
 * right edge of a 393px Pixel 5 screen. A document wider than the screen makes
 * Chrome grow the layout viewport away from the visual viewport, which
 * desynchronises Playwright's click coordinates from the browser's hit test —
 * the "Mobile Chrome only" repetition-block e2e failures.
 */
describe("computeTooltipPosition viewport clamping", () => {
  const PIXEL_5_WIDTH = 393;
  /** Mirrors `VIEWPORT_MARGIN` in compute-position.ts. */
  const MARGIN = 8;
  const MARK = makeRect({ width: 161, height: 120 });
  /** Anchor right (100) + SIDE_OFFSET (5): fits, so the clamp is a no-op. */
  const UNCLAMPED_LEFT = 105;

  afterEach(() => setViewportWidth(DEFAULT_INNER_WIDTH));

  it("should keep a right-side bubble inside a narrow viewport", () => {
    // Arrange
    setViewportWidth(PIXEL_5_WIDTH);
    const anchor = makeRect({ top: 400, bottom: 446, left: 16, right: 352 });

    // Act
    const { left } = computeTooltipPosition(anchor, MARK, "right", "start");

    // Assert
    expect(left).toBe(PIXEL_5_WIDTH - MARK.width - MARGIN);
    expect(left + MARK.width).toBeLessThanOrEqual(PIXEL_5_WIDTH);
  });

  it("should keep a left-side bubble off the left edge", () => {
    // Arrange
    setViewportWidth(PIXEL_5_WIDTH);
    const anchor = makeRect({ top: 400, bottom: 446, left: 20, right: 120 });

    // Act
    const { left } = computeTooltipPosition(anchor, MARK, "left", "start");

    // Assert
    expect(left).toBe(MARGIN);
  });

  it("should pin a bubble wider than the viewport to the left margin", () => {
    // Arrange
    setViewportWidth(PIXEL_5_WIDTH);
    const wide = makeRect({ width: 400, height: 120 });
    const anchor = makeRect({ top: 400, bottom: 446, left: 16, right: 352 });

    // Act
    const { left } = computeTooltipPosition(anchor, wide, "right", "start");

    // Assert
    expect(left).toBe(MARGIN);
  });

  it("should leave a bubble that already fits untouched", () => {
    // Arrange
    setViewportWidth(PIXEL_5_WIDTH);
    const anchor = makeRect({ top: 400, bottom: 446, left: 16, right: 100 });

    // Act
    const { left } = computeTooltipPosition(anchor, MARK, "right", "start");

    // Assert
    expect(left).toBe(UNCLAMPED_LEFT);
  });
});
