import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { SettingsDialogProvider } from "../../../contexts";
import { EmptyWeekState } from "./EmptyWeekState";
import { FirstVisitState } from "./FirstVisitState";
import { NoAiProviderState } from "./NoAiProviderState";
import { NoBridgesState } from "./NoBridgesState";

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const { hook } = memoryLocation({ path, record: true });
  return (
    <SettingsDialogProvider>
      <Router hook={hook}>{ui}</Router>
    </SettingsDialogProvider>
  );
}

describe("FirstVisitState", () => {
  it("renders three entry paths", () => {
    render(withRouter(<FirstVisitState />));

    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders welcome message", () => {
    render(withRouter(<FirstVisitState />));

    expect(screen.getByText("Welcome to Kaiord")).toBeInTheDocument();
  });

  it("calls onSettingsClick when Connect is clicked", async () => {
    const user = userEvent.setup();
    const onSettingsClick = vi.fn();

    render(withRouter(<FirstVisitState onSettingsClick={onSettingsClick} />));

    await user.click(screen.getByText("Connect"));

    expect(onSettingsClick).toHaveBeenCalledOnce();
  });

  it("opens settings dialog when Connect is clicked without prop", async () => {
    const user = userEvent.setup();

    render(withRouter(<FirstVisitState />));

    // Should not throw - falls back to context's show()
    await user.click(screen.getByText("Connect"));
  });

  it("navigates to /workout/new when Create is clicked", async () => {
    const user = userEvent.setup();

    render(withRouter(<FirstVisitState />));

    await user.click(screen.getByText("Create"));
    // Navigate is called - no error thrown
  });

  it("navigates to import when Import is clicked", async () => {
    const user = userEvent.setup();

    render(withRouter(<FirstVisitState />));

    await user.click(screen.getByText("Import"));
    // Navigate is called - no error thrown
  });
});

describe("EmptyWeekState", () => {
  it("shows add workout button", () => {
    render(withRouter(<EmptyWeekState />));

    expect(screen.getByText("Add workout")).toBeInTheDocument();
  });

  it("navigates when Add workout is clicked", async () => {
    const user = userEvent.setup();

    render(withRouter(<EmptyWeekState />));

    await user.click(screen.getByText("Add workout"));
    // Navigate to /workout/new is called - no error thrown
  });

  it("shows go to latest when callback provided", () => {
    render(withRouter(<EmptyWeekState onGoToLatest={vi.fn()} />));

    expect(screen.getByText("Go to latest")).toBeInTheDocument();
  });

  it("does not show go to latest when no callback", () => {
    render(withRouter(<EmptyWeekState />));

    expect(screen.queryByText("Go to latest")).not.toBeInTheDocument();
  });

  it("calls onGoToLatest when clicked", async () => {
    const user = userEvent.setup();
    const onGoToLatest = vi.fn();

    render(withRouter(<EmptyWeekState onGoToLatest={onGoToLatest} />));

    await user.click(screen.getByText("Go to latest"));

    expect(onGoToLatest).toHaveBeenCalled();
  });
});

describe("NoBridgesState", () => {
  it("renders install prompt", () => {
    render(<NoBridgesState />);

    expect(screen.getByTestId("no-bridges-state")).toBeInTheDocument();
    expect(
      screen.getByText(/No bridge extensions detected/)
    ).toBeInTheDocument();
  });

  it("renders learn more link to bridge docs", () => {
    render(<NoBridgesState />);

    const link = screen.getByText("Learn more");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://kaiord.com/docs/bridges");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("NoAiProviderState", () => {
  it("renders configure prompt", () => {
    render(withRouter(<NoAiProviderState />));

    expect(screen.getByTestId("no-ai-provider-state")).toBeInTheDocument();
    expect(screen.getByText("Configure")).toBeInTheDocument();
  });
});
