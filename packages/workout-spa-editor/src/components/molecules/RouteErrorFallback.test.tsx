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

  it("renders the error message", () => {
    renderWithRouter(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("has role=alert for accessibility", () => {
    renderWithRouter(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("calls onRetry when Retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithRouter(<RouteErrorFallback error={error} onRetry={onRetry} />);

    await user.click(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders Go to Calendar button", () => {
    renderWithRouter(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    expect(screen.getByText("Go to Calendar")).toBeInTheDocument();
  });

  it("navigates to /calendar when Go to Calendar is clicked", async () => {
    const user = userEvent.setup();
    const { location } = renderWithRouter(
      <RouteErrorFallback error={new Error("fail")} onRetry={vi.fn()} />
    );

    await user.click(screen.getByText("Go to Calendar"));

    expect(location.history).toContain("/calendar");
  });
});
