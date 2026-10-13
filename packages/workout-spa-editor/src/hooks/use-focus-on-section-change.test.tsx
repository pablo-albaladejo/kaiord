/**
 * Tests for `useFocusOnSectionChange`.
 *
 * Verifies focus moves to the `[data-settings-section]` element whose
 * attribute value matches the `?section=` query, the no-op paths
 * (absent / unknown section), and the same-section dedupe.
 */

import { act, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { SETTINGS_SECTION_ATTR } from "../components/pages/SettingsPage/settings-section";
import { useFocusOnSectionChange } from "./use-focus-on-section-change";

const FAKE_RAF = (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
};

function Harness() {
  useFocusOnSectionChange();
  return (
    <div>
      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "providers" }}
        data-testid="section-providers"
      >
        providers
      </section>
      <section
        tabIndex={-1}
        {...{ [SETTINGS_SECTION_ATTR]: "custom-instructions" }}
        data-testid="section-custom"
      >
        custom
      </section>
    </div>
  );
}

function focusedSection(): string | null {
  const el = document.activeElement as HTMLElement | null;
  return el?.getAttribute(SETTINGS_SECTION_ATTR) ?? null;
}

describe("useFocusOnSectionChange", () => {
  let originalRaf: typeof requestAnimationFrame;
  let originalCancel: typeof cancelAnimationFrame;
  beforeEach(() => {
    originalRaf = globalThis.requestAnimationFrame;
    originalCancel = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = FAKE_RAF as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = (() => undefined) as never;
  });
  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCancel;
    vi.restoreAllMocks();
  });

  it("should focus the element matching the section query on change", async () => {
    // Arrange
    const loc = memoryLocation({ path: "/settings/ai" });
    render(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );

    // Act
    act(() => {
      loc.navigate("/settings/ai?section=custom-instructions");
    });

    // Assert
    await waitFor(() => {
      expect(focusedSection()).toBe("custom-instructions");
    });
  });

  it("should focus the section when mounted under StrictMode with the query already set", async () => {
    // Arrange
    // A deferred frame whose cancellation really cancels, as in a browser;
    // StrictMode runs the effect, cleans it up, then runs it again.
    const frames = new Map<number, FrameRequestCallback>();
    let next = 0;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      frames.set(++next, cb);
      return next;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => {
      frames.delete(id);
    }) as typeof cancelAnimationFrame;
    const loc = memoryLocation({ path: "/settings/ai?section=providers" });

    // Act
    render(
      <StrictMode>
        <Router hook={loc.hook} searchHook={loc.searchHook}>
          <Harness />
        </Router>
      </StrictMode>
    );
    act(() => frames.forEach((cb) => cb(0)));

    // Assert
    expect(focusedSection()).toBe("providers");
  });

  it("should no-op when the section query is absent", () => {
    // Arrange
    const loc = memoryLocation({ path: "/settings/ai" });

    // Act
    render(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );

    // Assert
    expect(focusedSection()).toBeNull();
  });

  it("should ignore an unknown section value", () => {
    // Arrange
    const loc = memoryLocation({ path: "/settings/ai" });
    render(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );

    // Act
    act(() => {
      loc.navigate("/settings/ai?section=nope");
    });

    // Assert
    expect(focusedSection()).toBeNull();
  });

  it("should not re-fire focus when re-selecting the same section", async () => {
    // Arrange
    const loc = memoryLocation({ path: "/settings/ai?section=providers" });
    render(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );
    await waitFor(() => {
      expect(focusedSection()).toBe("providers");
    });
    (document.activeElement as HTMLElement | null)?.blur();

    // Act
    act(() => {
      loc.navigate("/settings/ai?section=providers");
    });

    // Assert
    expect(focusedSection()).toBeNull();
  });
});
