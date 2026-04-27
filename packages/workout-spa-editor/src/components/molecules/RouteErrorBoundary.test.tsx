/**
 * Tests for RouteErrorBoundary's analytics wiring.
 *
 * The boundary itself renders a child or a fallback; this suite focuses
 * on the analytics side-effect emitted from `componentDidCatch` and on
 * the resilience of the boundary when no analytics prop is provided.
 */
import type { Analytics } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { RouteErrorBoundary } from "./RouteErrorBoundary";

function Boom({ message = "kaboom" }: { message?: string }) {
  throw new Error(message);
}

function renderWithRouter(ui: React.ReactNode, path = "/calendar") {
  const { hook } = memoryLocation({ path, record: true });
  return render(<Router hook={hook}>{ui}</Router>);
}

describe("RouteErrorBoundary analytics", () => {
  // Suppress React's "uncaught render error" console noise so it does
  // not pollute the test output. The boundary still receives the error.
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("fires route-error event with current pathname when a child throws", () => {
    // Arrange
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };

    // Act
    renderWithRouter(
      <RouteErrorBoundary analytics={analytics}>
        <Boom />
      </RouteErrorBoundary>
    );

    // Assert
    expect(analytics.event).toHaveBeenCalledWith("route-error", {
      route: window.location.pathname,
    });
    // Fallback is rendered
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders fallback without throwing when no analytics prop is provided", () => {
    // Arrange & Act
    renderWithRouter(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>
    );

    // Assert — fallback rendered, no secondary error
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("does not fire route-error when child renders successfully", () => {
    // Arrange
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };

    // Act
    renderWithRouter(
      <RouteErrorBoundary analytics={analytics}>
        <div>healthy</div>
      </RouteErrorBoundary>
    );

    // Assert
    expect(analytics.event).not.toHaveBeenCalled();
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });
});
