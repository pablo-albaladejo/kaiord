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

  it("calls focus with preventScroll and scrollIntoView with 'auto' when motion is allowed", () => {
    // Arrange
    const el = document.createElement("div");
    const focusSpy = vi.spyOn(el, "focus");
    const scrollSpy = vi.fn();
    el.scrollIntoView = scrollSpy;

    // Act
    applyFocusToElement(el, { reduceMotion: false });

    // Assert
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollSpy).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "auto",
    });
  });

  it("uses 'instant' scrollIntoView when reduce-motion is set", () => {
    // Arrange
    const el = document.createElement("div");
    vi.spyOn(el, "focus").mockImplementation(() => {});
    const scrollSpy = vi.fn();
    el.scrollIntoView = scrollSpy;

    // Act
    applyFocusToElement(el, { reduceMotion: true });

    // Assert
    expect(scrollSpy).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "instant",
    });
  });

  it("does not call scrollIntoView when focus throws", () => {
    // Arrange
    const el = document.createElement("div");
    vi.spyOn(el, "focus").mockImplementation(() => {
      throw new Error("detached");
    });
    const scrollSpy = vi.fn();
    el.scrollIntoView = scrollSpy;

    // Act — must NOT throw out of the function.
    expect(() =>
      applyFocusToElement(el, { reduceMotion: false })
    ).not.toThrow();

    // Assert — scroll is skipped when focus failed.
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("still succeeds when scrollIntoView throws (legacy browser)", () => {
    // Arrange — legacy runtime where scrollIntoView doesn't accept the
    // options-object form.
    const el = document.createElement("div");
    const focusSpy = vi.spyOn(el, "focus").mockImplementation(() => {});
    el.scrollIntoView = () => {
      throw new TypeError("scrollIntoView");
    };

    // Act
    expect(() =>
      applyFocusToElement(el, { reduceMotion: false })
    ).not.toThrow();

    // Assert — focus still happened.
    expect(focusSpy).toHaveBeenCalled();
  });
});

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reflects matchMedia('(prefers-reduced-motion: reduce)')", () => {
    // Arrange — patch `window.matchMedia` directly; `prefersReducedMotion`
    // reads it off `window`.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn(() => ({ matches: true }) as unknown as MediaQueryList),
    });

    // Act + Assert
    expect(prefersReducedMotion()).toBe(true);
  });

  it("returns false when matchMedia is unavailable", () => {
    // Arrange
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    // Act + Assert
    expect(prefersReducedMotion()).toBe(false);
  });
});
