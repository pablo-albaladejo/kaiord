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

  it("should fire route-error event with the full scrubbed payload when a child throws", () => {
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

    // Assert — payload-shape correctness lives in
    // build-route-error-payload.test.ts; here we only verify the
    // boundary forwards the four-field shape to analytics.
    expect(analytics.event).toHaveBeenCalledTimes(1);
    const [eventName, payload] = (analytics.event as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    expect(eventName).toBe("route-error");
    expect(payload).toEqual(
      expect.objectContaining({
        route: expect.any(String),
        name: expect.any(String),
        message: expect.any(String),
        componentStack: expect.any(String),
      })
    );
    // Fallback is rendered
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should not invoke the payload builder when no analytics prop is provided (zero scrub work in noop deployments)", async () => {
    // Arrange — spy on the payload builder
    const buildModule = await import("../../lib/build-route-error-payload");
    const buildSpy = vi.spyOn(buildModule, "buildRouteErrorPayload");

    // Act
    renderWithRouter(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>
    );

    // Assert
    expect(buildSpy).not.toHaveBeenCalled();
    buildSpy.mockRestore();
  });

  it("should render fallback when analytics.event throws synchronously", () => {
    // Arrange — analytics.event throws (e.g., adapter misconfig)
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(() => {
        throw new Error("analytics down");
      }),
    };

    // Act
    renderWithRouter(
      <RouteErrorBoundary analytics={analytics}>
        <Boom />
      </RouteErrorBoundary>
    );

    // Assert — boundary still renders fallback (no secondary failure)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render fallback without throwing when no analytics prop is provided", () => {
    // Arrange & Act
    renderWithRouter(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>
    );

    // Assert — fallback rendered, no secondary error
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should not fire route-error when child renders successfully", () => {
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
