/**
 * Tests for `useFocusOnRouteChange`.
 *
 * Verifies focus moves to the `[data-route-heading]` element on
 * pathname change, and the negative-path warn-and-fallback when no
 * heading is present.
 */

import { act, render, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { ROUTE_HEADING_ATTR } from "../routing/constants";
import { useFocusOnRouteChange } from "./use-focus-on-route-change";

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
  initial: string;
  withHeading?: boolean;
};

function Harness({ initial, withHeading = true }: HarnessProps) {
  useFocusOnRouteChange();
  const [path, setPath] = useState(initial);
  return (
    <div>
      <button type="button" onClick={() => setPath("/library")}>
        go-library
      </button>
      {withHeading ? (
        <PageWithHeading label={path === "/library" ? "Library" : "Calendar"} />
      ) : (
        <PageWithoutHeading />
      )}
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
  });

  it("should focus the data-route-heading element on pathname change", async () => {
    // Arrange
    const loc = memoryLocation({ path: "/calendar" });
    const { rerender } = render(
      <Router hook={loc.hook}>
        <Harness initial="/calendar" />
      </Router>
    );
    act(() => {
      loc.navigate("/library");
    });

    // Act
    rerender(
      <Router hook={loc.hook}>
        <Harness initial="/library" />
      </Router>
    );

    // Assert
    await waitFor(() => {
      const focused = document.activeElement as HTMLElement | null;
      expect(focused?.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
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
          <Harness initial="/calendar" withHeading={false} />
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
        <Harness initial="/calendar" />
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
        <Harness initial="/library" />
      </Router>
    );

    // Assert
    await waitFor(() => {
      const focused = document.activeElement as HTMLElement | null;
      expect(focused?.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
    });
    expect(dropsLeft).toBe(0);
  });
});
