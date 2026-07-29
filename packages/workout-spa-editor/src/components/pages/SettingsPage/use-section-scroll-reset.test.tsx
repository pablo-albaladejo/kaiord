import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSectionScrollReset } from "./use-section-scroll-reset";

/**
 * jsdom does not define `document.scrollingElement` (`"scrollingElement" in
 * document` is false here), so these tests observe the `documentElement`
 * fallback the hook actually takes — jsdom does store `scrollTop` writes even
 * though it has no layout to scroll.
 */
const SCROLLED = 420;

const scrollTop = () => document.documentElement.scrollTop;

const renderAt = (section: string | undefined) =>
  renderHook(({ current }) => useSectionScrollReset(current), {
    initialProps: { current: section },
  });

describe("useSectionScrollReset", () => {
  it("should not reset the scroll on the first render", () => {
    // Arrange
    document.documentElement.scrollTop = SCROLLED;

    // Act
    renderAt("ai");

    // Assert
    expect(scrollTop()).toBe(SCROLLED);
  });

  it("should reset the scroll when the section changes", () => {
    // Arrange
    const { rerender } = renderAt("ai");
    document.documentElement.scrollTop = SCROLLED;

    // Act
    rerender({ current: "privacy" });

    // Assert
    expect(scrollTop()).toBe(0);
  });

  it("should reset the scroll when a section closes back to the index", () => {
    // Arrange
    const { rerender } = renderAt("ai");
    document.documentElement.scrollTop = SCROLLED;

    // Act
    rerender({ current: undefined });

    // Assert
    expect(scrollTop()).toBe(0);
  });

  it("should leave the scroll alone when the section is unchanged", () => {
    // Arrange
    const { rerender } = renderAt("ai");
    document.documentElement.scrollTop = SCROLLED;

    // Act
    rerender({ current: "ai" });

    // Assert
    expect(scrollTop()).toBe(SCROLLED);
  });
});
