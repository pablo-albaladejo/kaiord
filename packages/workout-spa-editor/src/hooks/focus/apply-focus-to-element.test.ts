/**
 * Unit tests for the low-level focus application (§7.6).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyFocusToElement,
  prefersReducedMotion,
} from "./apply-focus-to-element";

describe("applyFocusToElement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should focus with preventScroll and jump the element into view", () => {
    // Arrange
    const el = document.createElement("div");
    const focusSpy = vi.spyOn(el, "focus");
    const scrollSpy = vi.fn();
    el.scrollIntoView = scrollSpy;

    // Act
    applyFocusToElement(el);

    // Assert
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollSpy).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "instant",
    });
  });

  it("should not call scrollIntoView when focus throws", () => {
    // Arrange
    const el = document.createElement("div");
    vi.spyOn(el, "focus").mockImplementation(() => {
      throw new Error("detached");
    });
    const scrollSpy = vi.fn();

    // Act
    el.scrollIntoView = scrollSpy;

    // Assert
    expect(() => applyFocusToElement(el)).not.toThrow();
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("should still succeed when scrollIntoView throws (legacy browser)", () => {
    // Arrange
    const el = document.createElement("div");
    const focusSpy = vi.spyOn(el, "focus").mockImplementation(() => {});

    // Act
    el.scrollIntoView = () => {
      throw new TypeError("scrollIntoView");
    };

    // Assert
    expect(() => applyFocusToElement(el)).not.toThrow();
    expect(focusSpy).toHaveBeenCalled();
  });
});

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should reflect matchMedia('(prefers-reduced-motion: reduce)')", () => {
    // Arrange

    // Act
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn(() => ({ matches: true }) as unknown as MediaQueryList),
    });

    // Assert
    expect(prefersReducedMotion()).toBe(true);
  });

  it("should return false when matchMedia is unavailable", () => {
    // Arrange

    // Act
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    // Assert
    expect(prefersReducedMotion()).toBe(false);
  });
});
