import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { RouteErrorFallback } from "./RouteErrorFallback";

function renderWithRouter(ui: React.ReactNode, path = "/test") {
  const loc = memoryLocation({ path, record: true });
  return {
    ...render(<Router hook={loc.hook}>{ui}</Router>),
    location: loc,
  };
}

describe("RouteErrorFallback", () => {
  const error = new Error("Something broke");

  it("should render the error message", () => {
    // Arrange

    // Act

    renderWithRouter(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    // Assert

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("should have role=alert for accessibility", () => {
    // Arrange

    // Act

    renderWithRouter(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    // Assert

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should call onRetry when Retry button is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithRouter(<RouteErrorFallback error={error} onRetry={onRetry} />);

    // Act

    await user.click(screen.getByText("Retry"));

    // Assert

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("should render a Go to Today link to the Today summary", () => {
    // Arrange

    // Act

    renderWithRouter(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    // Assert

    expect(screen.getByRole("link", { name: "Go to Today" })).toHaveAttribute(
      "href",
      "/calendar"
    );
  });

  it("should navigate to /calendar when Go to Today is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const { location } = renderWithRouter(
      <RouteErrorFallback error={new Error("fail")} onRetry={vi.fn()} />
    );

    // Act

    await user.click(screen.getByText("Go to Today"));

    // Assert

    expect(location.history).toContain("/calendar");
  });
});
