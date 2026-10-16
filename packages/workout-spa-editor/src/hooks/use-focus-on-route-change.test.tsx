/**
 * Tests for `useFocusOnRouteChange`.
 *
 * Verifies focus moves to the `[data-route-heading]` element on
 * pathname change, and the negative-path warn-and-fallback when no
 * heading is present.
 */

import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { ROUTE_HEADING_ATTR } from "../routing/constants";
import { useFocusOnRouteChange } from "./use-focus-on-route-change";

// The rAF stays synchronous (FAKE_RAF); only the retry and budget timers are
// faked, so a test can step the 50 ms retry loop without waiting for it.
const TIMERS: (
  "setTimeout" | "setInterval" | "clearTimeout" | "clearInterval"
)[] = ["setTimeout", "setInterval", "clearTimeout", "clearInterval"];

const FAKE_RAF = (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
};

function PageWithHeading({ label }: { label: string }) {
  return (
    <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }}>
      {label}
    </h1>
  );
}

function PageWithoutHeading() {
  return <div>no heading</div>;
}

type HarnessProps = {
  withHeading?: boolean;
};

// The label is derived from the router, not from local state: a
// `useState(initial)` does not re-initialise on rerender, so the heading would
// keep reading "Calendar" after navigating and an assertion that only checks
// for `[data-route-heading]` would accept the stale one.
function Harness({ withHeading = true }: HarnessProps) {
  useFocusOnRouteChange();
  const [path] = useLocation();
  return (
    <div>
      {withHeading ? (
        <PageWithHeading label={path === "/library" ? "Library" : "Calendar"} />
      ) : (
        <PageWithoutHeading />
      )}
    </div>
  );
}

function AutoFocusHarness() {
  useFocusOnRouteChange();
  const [path] = useLocation();
  if (path !== "/library") return <PageWithHeading label="Calendar" />;
  return (
    <div>
      <PageWithHeading label="Library" />
      <input aria-label="Search" autoFocus />
    </div>
  );
}

describe("useFocusOnRouteChange", () => {
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
    vi.useRealTimers();
  });

  it("should focus the data-route-heading element on pathname change", async () => {
    // Arrange
    const loc = memoryLocation({ path: "/calendar" });
    const { rerender } = render(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );
    act(() => {
      loc.navigate("/library");
    });

    // Act
    rerender(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );

    // Assert
    await waitFor(() => {
      const focused = document.activeElement as HTMLElement | null;
      expect(focused?.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
      expect(focused?.textContent).toBe("Library");
    });
  });

  it(
    "should warn once and falls back to body when no [data-route-heading] is present",
    { timeout: 8000 },
    async () => {
      // Arrange
      const warn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const { hook } = memoryLocation({ path: "/calendar" });
      render(
        <Router hook={hook}>
          <Harness withHeading={false} />
        </Router>
      );
      await waitFor(
        () => {
          expect(warn).toHaveBeenCalled();
        },
        { timeout: 6000 }
      );

      // Act
      const focused = document.activeElement as HTMLElement | null;

      // Assert
      expect(focused?.hasAttribute(ROUTE_HEADING_ATTR) ?? false).toBe(false);
    }
  );

  it("should retry when the engine silently drops the first focus", async () => {
    // Arrange
    // Reproduces what headless Firefox on Linux does deterministically and
    // Mobile Safari does intermittently: focus() returns normally, throws
    // nothing, and activeElement never moves.
    const realFocus = HTMLElement.prototype.focus;
    // Armed only after mount: the hook also focuses on the initial pathname,
    // and a drop consumed there would leave the navigation under test with a
    // perfectly ordinary focus — a test that passes either way.
    let dropsLeft = 0;
    vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
      this: HTMLElement,
      options?: FocusOptions
    ) {
      if (dropsLeft > 0 && this.hasAttribute(ROUTE_HEADING_ATTR)) {
        dropsLeft -= 1;
        return;
      }
      realFocus.call(this, options);
    });
    const loc = memoryLocation({ path: "/calendar" });
    const { rerender } = render(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );
    (document.activeElement as HTMLElement | null)?.blur();
    dropsLeft = 1;
    act(() => {
      loc.navigate("/library");
    });

    // Act
    rerender(
      <Router hook={loc.hook}>
        <Harness />
      </Router>
    );

    // Assert
    await waitFor(() => {
      const focused = document.activeElement as HTMLElement | null;
      expect(focused?.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
      expect(focused?.textContent).toBe("Library");
    });
    expect(dropsLeft).toBe(0);
  });

  it("should stop retrying once the user has moved focus into a field", () => {
    // Arrange
    // Mobile Safari drops the heading focus for a while after a navigation.
    // The retry loop kept re-taking focus every 50 ms, so a field the user
    // (or Playwright's `fill`) had just focused lost its next keystrokes:
    // the text went to the heading and the field stayed empty.
    const realFocus = HTMLElement.prototype.focus;
    let dropping = false;
    vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
      this: HTMLElement,
      options?: FocusOptions
    ) {
      if (dropping && this.hasAttribute(ROUTE_HEADING_ATTR)) return;
      realFocus.call(this, options);
    });
    vi.useFakeTimers({ toFake: TIMERS });
    const loc = memoryLocation({ path: "/calendar" });
    const { rerender } = render(
      <Router hook={loc.hook}>
        <Harness />
        <input aria-label="API key" />
      </Router>
    );
    (document.activeElement as HTMLElement | null)?.blur();
    dropping = true;
    act(() => {
      loc.navigate("/library");
    });
    rerender(
      <Router hook={loc.hook}>
        <Harness />
        <input aria-label="API key" />
      </Router>
    );
    const field = document.querySelector<HTMLInputElement>("input")!;

    // Act
    field.focus();
    dropping = false;
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Assert
    expect(document.activeElement).toBe(field);
  });

  it("should leave focus on a field the new page autofocuses in the same commit", () => {
    // Arrange
    // The page's own `autoFocus` lands during the commit that changes the
    // pathname, before the route effect runs. Read at effect time it looked
    // like the focus the navigation started from, and the heading took it.
    const loc = memoryLocation({ path: "/calendar" });
    const view = () => (
      <Router hook={loc.hook}>
        <AutoFocusHarness />
      </Router>
    );
    const { rerender } = render(view());
    act(() => {
      loc.navigate("/library");
    });

    // Act
    rerender(view());

    // Assert
    expect(document.activeElement).toBe(
      document.querySelector('input[aria-label="Search"]')
    );
  });

  it("should never take focus from a field that kept it across the route change", () => {
    // Arrange
    const loc = memoryLocation({ path: "/calendar" });
    const view = () => (
      <Router hook={loc.hook}>
        <Harness />
        <input aria-label="Header search" />
      </Router>
    );
    const { rerender } = render(view());
    const field = document.querySelector<HTMLInputElement>("input")!;
    field.focus();
    act(() => {
      loc.navigate("/library");
    });

    // Act
    rerender(view());

    // Assert
    expect(document.activeElement).toBe(field);
  });

  it("should move focus off a navigation control that kept it across the route change", () => {
    // Arrange
    // A section rail stays mounted while its links change the route: the
    // activated link is the stale owner the heading replaces.
    const loc = memoryLocation({ path: "/calendar" });
    const view = () => (
      <Router hook={loc.hook}>
        <Harness />
        <button type="button">Library</button>
      </Router>
    );
    const { rerender } = render(view());
    document.querySelector<HTMLButtonElement>("button")!.focus();
    act(() => {
      loc.navigate("/library");
    });

    // Act
    rerender(view());

    // Assert
    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
  });
});
