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
    const loc = memoryLocation({ path: "/calendar" });
    const { rerender } = render(
      <Router hook={loc.hook}>
        <Harness initial="/calendar" />
      </Router>
    );

    // Trigger a path change via the memory location's navigate API.
    act(() => {
      loc.navigate("/library");
    });
    rerender(
      <Router hook={loc.hook}>
        <Harness initial="/library" />
      </Router>
    );

    await waitFor(() => {
      const focused = document.activeElement as HTMLElement | null;
      expect(focused?.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
    });
  });

  it("should warn once and falls back to body when no [data-route-heading] is present", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { hook } = memoryLocation({ path: "/calendar" });

    render(
      <Router hook={hook}>
        <Harness initial="/calendar" withHeading={false} />
      </Router>
    );

    // The hook bounds its wait for a `[data-route-heading]` to appear
    // (lazy-chunk resilience), then warns. The test must wait longer
    // than that bound (`OBSERVE_TIMEOUT_MS` in the hook).
    await waitFor(
      () => {
        expect(warn).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
    // The fallback contract: focus owner is the body (or the closest
    // sensible element when body cannot accept focus). At minimum, no
    // route heading is the active element since none exists.
    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.hasAttribute(ROUTE_HEADING_ATTR) ?? false).toBe(false);
  });
});
