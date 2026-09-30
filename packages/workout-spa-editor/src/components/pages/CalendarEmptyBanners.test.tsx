import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import {
  CalendarEmptyBanners,
  type CalendarEmptyBannersProps,
} from "./CalendarEmptyBanners";

const RAW_COUNT = 2;
const READY_COUNT = 3;
const PLAN_COUNT = 3;

const props = (
  overrides: Partial<CalendarEmptyBannersProps> = {}
): CalendarEmptyBannersProps => ({
  weekId: "2026-W23",
  hasAnyWorkouts: true,
  hasWeekWorkouts: true,
  readyCount: 0,
  hasAiProvider: true,
  extensionInstalled: true,
  rawCount: 0,
  hasAnyPlans: false,
  batchMessage: null,
  onDismissBatch: vi.fn(),
  batchIsProcessing: false,
  batchProgress: null,
  onBatchProcess: vi.fn(),
  onBatchCancel: vi.fn(),
  ...overrides,
});

function renderBanners(overrides: Partial<CalendarEmptyBannersProps> = {}) {
  const { hook } = memoryLocation({ path: "/calendar", record: true });
  return render(
    <Router hook={hook}>
      <CalendarEmptyBanners {...props(overrides)} />
    </Router>
  );
}

describe("CalendarEmptyBanners", () => {
  it("should speak on a true first run instead of rendering nothing", () => {
    // Arrange

    // Act
    renderBanners({ hasAnyWorkouts: false, hasWeekWorkouts: false });

    // Assert
    expect(screen.getByTestId("first-run-guide")).toBeInTheDocument();
  });

  it("should not repeat the dependencies the first-run guide already names", () => {
    // Arrange

    // Act
    renderBanners({
      hasAnyWorkouts: false,
      hasWeekWorkouts: false,
      hasAiProvider: false,
      extensionInstalled: false,
      rawCount: RAW_COUNT,
      readyCount: READY_COUNT,
    });

    // Assert
    expect(screen.queryByTestId("empty-week-state")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("no-ai-provider-state")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("no-bridges-state")).not.toBeInTheDocument();
  });

  it("should offer exactly one action for the week's raw sessions", () => {
    // Arrange

    // Act
    renderBanners({ rawCount: RAW_COUNT, hasAiProvider: true });

    // Assert
    expect(screen.getByTestId("batch-processing-banner")).toBeInTheDocument();
    expect(
      screen.queryByTestId("no-ai-provider-state")
    ).not.toBeInTheDocument();
  });

  it("should swap that action for its blocker when there is no key", () => {
    // Arrange

    // Act
    renderBanners({ rawCount: RAW_COUNT, hasAiProvider: false });

    // Assert
    expect(screen.getByTestId("no-ai-provider-state")).toBeInTheDocument();
    expect(
      screen.queryByTestId("batch-processing-banner")
    ).not.toBeInTheDocument();
  });

  it("should say nothing at all about a week that needs nothing", () => {
    // Arrange

    // Act
    const { container } = renderBanners();

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should report ready sessions that cannot reach a watch", () => {
    // Arrange

    // Act
    renderBanners({ readyCount: READY_COUNT, extensionInstalled: false });

    // Assert
    expect(screen.getByTestId("no-bridges-state")).toBeInTheDocument();
  });
  it("should hand a first run whose week has coach plans to the missing-key banner", () => {
    // Arrange

    // Act
    renderBanners({
      hasAnyWorkouts: false,
      hasWeekWorkouts: false,
      hasAiProvider: false,
      planCount: PLAN_COUNT,
      hasAnyPlans: true,
    });

    // Assert
    expect(screen.queryByTestId("first-run-guide")).not.toBeInTheDocument();
    expect(screen.queryByTestId("empty-week-state")).not.toBeInTheDocument();
    expect(screen.getByTestId("no-ai-provider-state")).toHaveTextContent(
      "3 sessions arrived as prose"
    );
  });

  it("should not call a week of coach plans empty once a key exists", () => {
    // Arrange

    // Act
    const { container } = renderBanners({
      hasAnyWorkouts: false,
      hasWeekWorkouts: false,
      planCount: PLAN_COUNT,
      hasAnyPlans: true,
    });

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should tick the first-run steps that are already true", () => {
    // Arrange

    // Act
    renderBanners({
      hasAnyWorkouts: false,
      hasWeekWorkouts: false,
      sourceLinked: true,
      hasAiProvider: false,
      extensionInstalled: true,
    });

    // Assert
    expect(screen.getByTestId("first-run-step-sources")).toHaveAttribute(
      "data-done",
      "true"
    );
    expect(screen.getByTestId("first-run-step-aiKey")).toHaveAttribute(
      "data-done",
      "false"
    );
    expect(
      screen.getByTestId("first-run-step-bridge-done")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add a key" })
    ).toBeInTheDocument();
  });

  it("should not greet a coached profile with the guide on a week without plans", () => {
    // Arrange
    // The coach's plans sit in another week: the user is past the first run,
    // and this week is simply empty.

    // Act
    renderBanners({
      hasAnyWorkouts: false,
      hasWeekWorkouts: false,
      planCount: 0,
      hasAnyPlans: true,
    });

    // Assert
    expect(screen.queryByTestId("first-run-guide")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-week-state")).toBeInTheDocument();
  });

  it("should render nothing while it cannot yet tell whether the profile has plans", () => {
    // Arrange

    // Act
    const { container } = renderBanners({
      hasAnyWorkouts: false,
      hasWeekWorkouts: false,
      hasAnyPlans: undefined,
    });

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
