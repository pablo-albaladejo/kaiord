import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { EmptyWeekState } from "./EmptyWeekState";
import { NoAiProviderState } from "./NoAiProviderState";
import { NoBridgesState } from "./NoBridgesState";

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const { hook } = memoryLocation({ path, record: true });
  return <Router hook={hook}>{ui}</Router>;
}

describe("EmptyWeekState", () => {
  it("should show add workout button", () => {
    // Arrange

    // Act

    render(withRouter(<EmptyWeekState weekId="2026-W23" />));

    // Assert

    expect(screen.getByText("Add workout")).toBeInTheDocument();
  });

  it("should navigate when Add workout is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { hook, history } = memoryLocation({
      path: "/calendar",
      record: true,
    });
    render(
      <Router hook={hook}>
        <EmptyWeekState weekId="2026-W23" />
      </Router>
    );

    // Act
    await user.click(screen.getByText("Add workout"));

    // Assert
    expect(history.at(-1)).toContain("/workout/new");
  });

  it("should show go to latest when callback provided", () => {
    // Arrange

    // Act

    render(
      withRouter(<EmptyWeekState weekId="2026-W23" onGoToLatest={vi.fn()} />)
    );

    // Assert

    expect(screen.getByText("Go to latest")).toBeInTheDocument();
  });

  it("should not show go to latest when no callback", () => {
    // Arrange

    // Act

    render(withRouter(<EmptyWeekState weekId="2026-W23" />));

    // Assert

    expect(screen.queryByText("Go to latest")).not.toBeInTheDocument();
  });

  it("should call onGoToLatest when clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onGoToLatest = vi.fn();

    render(
      withRouter(
        <EmptyWeekState weekId="2026-W23" onGoToLatest={onGoToLatest} />
      )
    );

    // Act

    await user.click(screen.getByText("Go to latest"));

    // Assert

    expect(onGoToLatest).toHaveBeenCalled();
  });
});

describe("NoBridgesState", () => {
  it("should render install prompt", () => {
    // Arrange

    // Act

    render(<NoBridgesState />);

    // Assert

    expect(screen.getByTestId("no-bridges-state")).toBeInTheDocument();
    expect(
      screen.getByText(/No bridge extensions detected/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Garmin Connect, Train2Go/)).toBeInTheDocument();
  });

  it("should render learn more link to bridge docs", () => {
    // Arrange

    render(<NoBridgesState />);

    // Act

    const link = screen.getByText("Learn more");

    // Assert

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://kaiord.com/docs/bridges");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("NoAiProviderState", () => {
  it("should render configure prompt", () => {
    // Arrange

    // Act

    render(withRouter(<NoAiProviderState />));

    // Assert

    expect(screen.getByTestId("no-ai-provider-state")).toBeInTheDocument();
    expect(screen.getByText("Configure")).toBeInTheDocument();
  });
});
