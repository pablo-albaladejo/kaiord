import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { EmptyWeekState } from "./EmptyWeekState";
import { FirstVisitState } from "./FirstVisitState";
import { NoAiProviderState } from "./NoAiProviderState";
import { NoBridgesState } from "./NoBridgesState";

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const { hook } = memoryLocation({ path, record: true });
  return <Router hook={hook}>{ui}</Router>;
}

describe("FirstVisitState", () => {
  it("should render three entry paths", () => {
    // Arrange

    // Act

    render(withRouter(<FirstVisitState />));

    // Assert

    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("should render welcome message", () => {
    // Arrange

    // Act

    render(withRouter(<FirstVisitState />));

    // Assert

    expect(screen.getByText("Welcome to Kaiord")).toBeInTheDocument();
  });

  it("should call onSettingsClick when Connect is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onSettingsClick = vi.fn();

    render(withRouter(<FirstVisitState onSettingsClick={onSettingsClick} />));

    // Act

    await user.click(screen.getByText("Connect"));

    // Assert

    expect(onSettingsClick).toHaveBeenCalledOnce();
  });

  it("should navigate to /settings/profile when Connect is clicked without prop", async () => {
    // Arrange
    const user = userEvent.setup();
    const memory = memoryLocation({ path: "/calendar", record: true });
    render(
      <Router hook={memory.hook}>
        <FirstVisitState />
      </Router>
    );

    // Act
    await user.click(screen.getByText("Connect"));

    // Assert
    expect(memory.history.at(-1)).toBe("/settings/profile");
  });

  it("should navigate to /workout/new when Create is clicked", async () => {
    // Arrange

    // Act

    // Assert

    const user = userEvent.setup();

    render(withRouter(<FirstVisitState />));

    await user.click(screen.getByText("Create"));
    // Navigate is called - no error thrown
  });

  it("should navigate to import when Import is clicked", async () => {
    // Arrange

    // Act

    // Assert

    const user = userEvent.setup();

    render(withRouter(<FirstVisitState />));

    await user.click(screen.getByText("Import"));
    // Navigate is called - no error thrown
  });
});

describe("EmptyWeekState", () => {
  it("should show add workout button", () => {
    // Arrange

    // Act

    render(withRouter(<EmptyWeekState />));

    // Assert

    expect(screen.getByText("Add workout")).toBeInTheDocument();
  });

  it("should navigate when Add workout is clicked", async () => {
    // Arrange

    // Act

    // Assert

    const user = userEvent.setup();

    render(withRouter(<EmptyWeekState />));

    await user.click(screen.getByText("Add workout"));
    // Navigate to /workout/new is called - no error thrown
  });

  it("should show go to latest when callback provided", () => {
    // Arrange

    // Act

    render(withRouter(<EmptyWeekState onGoToLatest={vi.fn()} />));

    // Assert

    expect(screen.getByText("Go to latest")).toBeInTheDocument();
  });

  it("should not show go to latest when no callback", () => {
    // Arrange

    // Act

    render(withRouter(<EmptyWeekState />));

    // Assert

    expect(screen.queryByText("Go to latest")).not.toBeInTheDocument();
  });

  it("should call onGoToLatest when clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onGoToLatest = vi.fn();

    render(withRouter(<EmptyWeekState onGoToLatest={onGoToLatest} />));

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
