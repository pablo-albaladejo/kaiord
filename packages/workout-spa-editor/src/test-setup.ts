import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Filter out act() warnings from Radix UI internal components
// These are false positives in Node 20.x that don't appear in Node 22.x
// The warnings come from async state updates in Radix primitives (Tooltip, Presence, Portal, etc.)
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    // Ignore act() warnings from Radix UI components
    if (
      message.includes("not wrapped in act(...)") &&
      (message.includes("Tooltip") ||
        message.includes("Presence") ||
        message.includes("Portal") ||
        message.includes("PopperContent") ||
        message.includes("DismissableLayer") ||
        message.includes("FocusScope") ||
        message.includes("TargetPicker"))
    ) {
      return;
    }
    originalError(...args);
  };
});

// Mock window.matchMedia for theme tests
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false, // Default to light mode
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(), // Deprecated but some browsers still use it
      removeListener: vi.fn(), // Deprecated but some browsers still use it
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock Pointer Capture API for Radix UI Toast
  // jsdom doesn't implement these methods, causing errors in Radix UI components
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }

  // Mock ResizeObserver for Radix UI Tooltip
  // jsdom doesn't implement ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  console.error = originalError;
});
