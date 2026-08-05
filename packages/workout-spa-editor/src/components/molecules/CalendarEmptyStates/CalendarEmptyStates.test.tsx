import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { EmptyWeekState } from "./EmptyWeekState";
import { FIRST_RUN_STEPS } from "./first-run-steps";
import { FirstRunGuide } from "./FirstRunGuide";
import { NoAiProviderState } from "./NoAiProviderState";
import { NoBridgesState } from "./NoBridgesState";

const RAW_COUNT = 2;
const READY_COUNT = 3;

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const { hook } = memoryLocation({ path, record: true });
  return <Router hook={hook}>{ui}</Router>;
}

describe("FirstRunGuide", () => {
  it("should state the three things that have to be true", () => {
    // Arrange

    // Act
    render(withRouter(<FirstRunGuide weekId="2026-W23" />));

    // Assert
    expect(screen.getByTestId("first-run-guide")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(
      FIRST_RUN_STEPS.length
    );
  });

  it("should name the consequence of each missing dependency", () => {
    // Arrange

    // Act
    render(withRouter(<FirstRunGuide weekId="2026-W23" />));

    // Assert
    expect(screen.getByText(/the week stays empty/)).toBeInTheDocument();
    expect(screen.getByText(/Your key, your bill/)).toBeInTheDocument();
    expect(
      screen.getByText(/you can still download the file/)
    ).toBeInTheDocument();
  });

  it("should offer the manual path that needs none of the three", async () => {
    // Arrange
    const user = userEvent.setup();
    const { hook, history } = memoryLocation({
      path: "/calendar",
      record: true,
    });
    render(
      <Router hook={hook}>
        <FirstRunGuide weekId="2026-W23" />
      </Router>
    );

    // Act
    await user.click(screen.getByTestId("first-run-add-workout"));

    // Assert
    expect(history.at(-1)).toContain("/workout/new");
  });
});

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

  it("should name the date of the last session rather than the empty week", () => {
    // Arrange

    // Act
    render(
      withRouter(
        <EmptyWeekState
          weekId="2026-W23"
          latestDate="12 Jul"
          onGoToLatest={vi.fn()}
        />
      )
    );

    // Assert
    expect(
      screen.getByText(/your last session was 12 Jul/)
    ).toBeInTheDocument();
    expect(screen.getByText("Go to 12 Jul")).toBeInTheDocument();
  });

  it("should not offer a date it does not have", () => {
    // Arrange

    // Act

    render(withRouter(<EmptyWeekState weekId="2026-W23" />));

    // Assert

    expect(screen.queryByText(/Go to /)).not.toBeInTheDocument();
  });

  it("should call onGoToLatest when clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onGoToLatest = vi.fn();

    render(
      withRouter(
        <EmptyWeekState
          weekId="2026-W23"
          latestDate="12 Jul"
          onGoToLatest={onGoToLatest}
        />
      )
    );

    // Act

    await user.click(screen.getByText("Go to 12 Jul"));

    // Assert

    expect(onGoToLatest).toHaveBeenCalled();
  });
});

describe("NoBridgesState", () => {
  it("should say what the ready sessions cannot do", () => {
    // Arrange

    // Act

    render(<NoBridgesState readyCount={READY_COUNT} />);

    // Assert

    expect(screen.getByTestId("no-bridges-state")).toBeInTheDocument();
    expect(
      screen.getByText(
        `${READY_COUNT} sessions are ready but can't reach your watch`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/no public API for workouts/)).toBeInTheDocument();
  });

  it("should make installing the bridge the primary route", () => {
    // Arrange

    render(<NoBridgesState readyCount={READY_COUNT} />);

    // Act

    const link = screen.getByText("Install the bridge");

    // Assert

    expect(link).toHaveAttribute("href", "https://kaiord.com/docs/bridges");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("NoAiProviderState", () => {
  it("should say what the raw sessions are stuck as", () => {
    // Arrange

    // Act

    render(withRouter(<NoAiProviderState rawCount={RAW_COUNT} />));

    // Assert

    expect(screen.getByTestId("no-ai-provider-state")).toBeInTheDocument();
    expect(
      screen.getByText(
        `${RAW_COUNT} sessions arrived as prose and are stuck that way`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your watch can't receive prose/)
    ).toBeInTheDocument();
  });

  it("should make adding a key the fix", async () => {
    // Arrange
    const user = userEvent.setup();
    const { hook, history } = memoryLocation({
      path: "/calendar",
      record: true,
    });
    render(
      <Router hook={hook}>
        <NoAiProviderState rawCount={RAW_COUNT} />
      </Router>
    );

    // Act
    await user.click(screen.getByText("Add an AI key"));

    // Assert
    expect(history.at(-1)).toBe("/settings/ai");
  });
});
