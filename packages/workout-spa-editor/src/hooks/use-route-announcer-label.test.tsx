/**
 * Tests for `useRouteAnnouncerLabel`.
 *
 * Drives the hook with wouter's memoryLocation so each pathname maps
 * to its expected SR-friendly label. Query-string changes are
 * verified to NOT change the label (the hook reads `useLocation()[0]`,
 * which excludes search). Initial mount with a deep-linked URL must
 * produce a non-empty label on first render so a deep-load triggers
 * exactly one announcement.
 */

import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { useRouteAnnouncerLabel } from "./use-route-announcer-label";

function wrapWithRouter(path: string) {
  const { hook } = memoryLocation({ path });
  return ({ children }: { children: ReactNode }) => (
    <Router hook={hook}>{children}</Router>
  );
}

describe("useRouteAnnouncerLabel", () => {
  it.each([
    ["/", "Calendar page"],
    ["/calendar", "Calendar page"],
    ["/calendar/2026-W18", "Calendar page"],
    ["/library", "Library page"],
    ["/athlete", "Athlete page"],
    ["/workout/new", "New workout"],
    ["/workout/view/abc-123", "Workout page"],
    ["/workout/abc-123", "Edit workout"],
  ])("should return %s -> %s", (path, expected) => {
    // Arrange

    // Act
    const { result } = renderHook(() => useRouteAnnouncerLabel(), {
      wrapper: wrapWithRouter(path),
    });

    // Assert
    expect(result.current).toBe(expected);
  });

  it("should return a non-empty label on initial mount with a deep-linked URL", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useRouteAnnouncerLabel(), {
      wrapper: wrapWithRouter("/library"),
    });

    // Assert
    expect(result.current).not.toBe("");
    expect(result.current).toBe("Library page");
  });

  it("should not change the label on query-string changes (pathname stays /library)", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useRouteAnnouncerLabel(), {
      wrapper: wrapWithRouter("/library?filter=running"),
    });

    // Assert
    expect(result.current).toBe("Library page");
  });
});
