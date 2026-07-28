import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useSectionScrollReset } from "./use-section-scroll-reset";

/** Any non-zero offset; the hook only ever compares against the top. */
const SCROLLED = 420;

/**
 * jsdom leaves `document.scrollingElement` undefined and, having no layout,
 * ignores `scrollTop` writes on the real `documentElement`. Standing in a
 * plain object makes the hook's write observable.
 */
const stubScroller = (scrollTop: number): { scrollTop: number } => {
  const scroller = { scrollTop };
  Object.defineProperty(document, "scrollingElement", {
    configurable: true,
    value: scroller,
  });
  return scroller;
};

const renderAt = (section: string | undefined) =>
  renderHook(({ current }) => useSectionScrollReset(current), {
    initialProps: { current: section },
  });

afterEach(() => {
  Reflect.deleteProperty(document, "scrollingElement");
});

describe("useSectionScrollReset", () => {
  it("should not reset the scroll on the first render", () => {
    // Arrange
    const scroller = stubScroller(SCROLLED);

    // Act
    renderAt("ai");

    // Assert
    expect(scroller.scrollTop).toBe(SCROLLED);
  });

  it("should reset the scroll when the section changes", () => {
    // Arrange
    const scroller = stubScroller(0);
    const { rerender } = renderAt("ai");
    scroller.scrollTop = SCROLLED;

    // Act
    rerender({ current: "privacy" });

    // Assert
    expect(scroller.scrollTop).toBe(0);
  });

  it("should reset the scroll when a section closes back to the index", () => {
    // Arrange
    const scroller = stubScroller(0);
    const { rerender } = renderAt("ai");
    scroller.scrollTop = SCROLLED;

    // Act
    rerender({ current: undefined });

    // Assert
    expect(scroller.scrollTop).toBe(0);
  });

  it("should leave the scroll alone when the section is unchanged", () => {
    // Arrange
    const scroller = stubScroller(0);
    const { rerender } = renderAt("ai");
    scroller.scrollTop = SCROLLED;

    // Act
    rerender({ current: "ai" });

    // Assert
    expect(scroller.scrollTop).toBe(SCROLLED);
  });
});
