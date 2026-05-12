import { describe, expect, it } from "vitest";

import type { Align, Side } from "./compute-position";
import { computeTooltipPosition } from "./compute-position";

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
