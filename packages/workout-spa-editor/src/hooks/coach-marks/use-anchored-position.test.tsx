/**
 * `useAnchoredPosition` must produce the SAME numbers as the tooltip atom for
 * the same anchor — that shared math is the whole point of retiring
 * `position-utils`' fixed viewport percentages.
 */

import { render } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";

import {
  type Align,
  computeTooltipPosition,
  type Position,
  type Side,
} from "../../components/atoms/Tooltip/compute-position";
import { useAnchoredPosition } from "./use-anchored-position";

const rect = (r: Partial<DOMRect>): DOMRect => ({ ...r }) as DOMRect;

const stub = (r: Partial<DOMRect>): HTMLElement => {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => rect(r);
  return el;
};

const ANCHOR = {
  top: 100,
  left: 40,
  right: 240,
  bottom: 160,
  width: 200,
  height: 60,
};
const MARK = {
  top: 0,
  left: 0,
  right: 330,
  bottom: 120,
  width: 330,
  height: 120,
};

const renderHook = (
  anchor: HTMLElement | null,
  mark: HTMLElement | null,
  side: Side = "right",
  align: Align = "start"
) => {
  const sink = { current: null as Position | null };
  const Probe = () => {
    sink.current = useAnchoredPosition(anchor, mark, side, align);
    return null;
  };
  render(<Probe />);
  return sink;
};

describe("useAnchoredPosition", () => {
  it("should place the mark using the shared tooltip math", () => {
    // Arrange
    const anchor = stub(ANCHOR);
    const mark = stub(MARK);

    // Act
    const sink = renderHook(anchor, mark, "right", "start");

    // Assert
    expect(sink.current).toEqual(
      computeTooltipPosition(rect(ANCHOR), rect(MARK), "right", "start")
    );
  });

  it("should honour the side the mark declares", () => {
    // Arrange
    const anchor = stub(ANCHOR);
    const mark = stub(MARK);

    // Act
    const sink = renderHook(anchor, mark, "bottom", "center");

    // Assert
    expect(sink.current).toEqual(
      computeTooltipPosition(rect(ANCHOR), rect(MARK), "bottom", "center")
    );
  });

  it("should report no position while the anchor is missing", () => {
    // Arrange
    const mark = stub(MARK);

    // Act
    const sink = renderHook(null, mark);

    // Assert
    expect(sink.current).toBeNull();
  });

  it("should report no position before the mark has been measured", () => {
    // Arrange
    const anchor = stub(ANCHOR);

    // Act
    const sink = renderHook(anchor, null);

    // Assert
    expect(sink.current).toBeNull();
  });

  it("should re-measure when the window resizes", () => {
    // Arrange
    let anchorRect = ANCHOR;
    const anchor = document.createElement("div");
    anchor.getBoundingClientRect = () => rect(anchorRect);
    const sink = renderHook(anchor, stub(MARK), "right", "start");
    const before = sink.current;

    // Act
    anchorRect = { ...ANCHOR, left: 400, right: 600 };
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // Assert
    expect(sink.current).not.toEqual(before);
  });

  it("should re-measure on a scroll from a nested container", () => {
    // Arrange
    let anchorRect = ANCHOR;
    const anchor = document.createElement("div");
    anchor.getBoundingClientRect = () => rect(anchorRect);
    const sink = renderHook(anchor, stub(MARK), "right", "start");
    const before = sink.current;

    // Act
    // Capture-phase listener, so a non-bubbling nested scroll still reaches it.
    anchorRect = { ...ANCHOR, top: 900, bottom: 960 };
    act(() => {
      document.body.dispatchEvent(new Event("scroll", { bubbles: false }));
    });

    // Assert
    expect(sink.current).not.toEqual(before);
  });
});
