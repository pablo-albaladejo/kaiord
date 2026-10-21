import type { PendingAction } from "@kaiord/ai";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PendingActionCard } from "./PendingActionCard";

const label = vi.hoisted(() => ({
  value: undefined as
    { title: string; duration: string; date: string } | null | undefined,
}));

vi.mock("../../../hooks/use-workout-label-live", () => ({
  useWorkoutLabelLive: () => label.value,
}));

const pending = (toolName: string, input: unknown): PendingAction => ({
  toolCallId: "call-1",
  toolName,
  input,
});

const renderCard = (action: PendingAction) =>
  render(
    <PendingActionCard
      action={action}
      onApprove={vi.fn()}
      onDeny={vi.fn()}
      busy={false}
    />
  );

describe("PendingActionCard", () => {
  it.each([
    [
      "create_workout",
      { description: "Easy run with strides", date: "2026-10-16" },
      "On Oct 16: “Easy run with strides”",
    ],
    [
      "create_workout",
      { description: "Easy run", date: "2026-10-16", sport: "running" },
      "Running on Oct 16: “Easy run”",
    ],
    [
      "create_workout",
      { description: "Easy run", date: "2026-10-16", sport: "rowing" },
      "On Oct 16: “Easy run”",
    ],
    [
      "log_intake",
      {
        date: "2026-10-16",
        kcal: 400,
        proteinG: 20,
        carbG: 50,
        fatG: 10,
        mealSlot: "breakfast",
      },
      "Breakfast: 400 kcal (protein 20 g · carbs 50 g · fat 10 g) on Oct 16",
    ],
    [
      "log_intake",
      {
        date: "2026-10-16",
        kcal: 400,
        proteinG: 20,
        carbG: 50,
        fatG: 10,
        mealSlot: "brunch",
      },
      "400 kcal (protein 20 g · carbs 50 g · fat 10 g) on Oct 16",
    ],
    [
      "log_health_metric",
      { metric: "sleep", day: "2026-10-16", value: 7 },
      "Sleep: 7 h on Oct 16",
    ],
    [
      "log_intake",
      {
        date: "2026-10-16",
        kcal: 650,
        proteinG: 40,
        carbG: 80,
        fatG: 18,
        label: "Lunch",
      },
      "“Lunch”: 650 kcal (protein 40 g · carbs 80 g · fat 18 g) on Oct 16",
    ],
    [
      "set_data_route",
      {
        action: "set_source_policy",
        dataType: "sleep",
        mode: "priority",
        sourceOrder: ["whoop", "garmin"],
      },
      "Sleep: read from whoop → garmin, in that order",
    ],
    [
      "set_data_route",
      {
        action: "disable_route",
        dataType: "weight",
        integrationId: "garmin",
        direction: "export",
      },
      "Stop sending Weight to garmin",
    ],
    [
      "sync_coaching",
      {},
      "Fetch the latest prescribed activities from your coaching provider.",
    ],
  ])("should describe %s in words instead of raw JSON", (tool, input, line) => {
    // Arrange
    const action = pending(tool, input);

    // Act
    const { container } = renderCard(action);

    // Assert
    expect(screen.getByText(line)).toBeInTheDocument();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("should name the workout a Garmin push would send", () => {
    // Arrange
    label.value = { title: "Easy run", duration: "45 min", date: "2026-10-16" };

    // Act
    renderCard(pending("push_to_garmin", { workoutId: "w1" }));

    // Assert
    expect(screen.getByText("Confirm: Send to Garmin")).toBeInTheDocument();
    expect(
      screen.getByText("“Easy run” (45 min) on Oct 16")
    ).toBeInTheDocument();
  });

  it("should say a workout is missing instead of showing its id", () => {
    // Arrange
    label.value = null;

    // Act
    renderCard(pending("push_to_garmin", { workoutId: "w-gone" }));

    // Assert
    expect(
      screen.getByText(/not in the active athlete's library/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/w-gone/)).toBeNull();
  });

  it.each(["push_to_garmin", "sync_coaching"])(
    "should warn that %s reaches outside the device",
    (tool) => {
      // Arrange
      label.value = undefined;

      // Act
      renderCard(pending(tool, { workoutId: "w1" }));

      // Assert
      expect(
        screen.getByText(/outside your device|off your device/)
      ).toBeInTheDocument();
    }
  );

  it.each([
    "create_workout",
    "log_health_metric",
    "log_intake",
    "set_data_route",
  ])("should not warn about leaving the device for local %s", (tool) => {
    // Arrange
    const action = pending(tool, {});

    // Act
    renderCard(action);

    // Assert
    expect(
      screen.queryByText(/outside your device|off your device/)
    ).toBeNull();
  });

  it("should fall back to a plain notice when the input cannot be read", () => {
    // Arrange
    const action = pending("log_health_metric", { metric: "mood" });

    // Act
    renderCard(action);

    // Assert
    expect(screen.getByText(/could not read/)).toBeInTheDocument();
  });

  it.each([
    ["log_health_metric", { metric: "mood" }],
    ["delete_everything", { all: true }],
  ])(
    "should not let %s be approved when the card cannot describe it",
    (tool, input) => {
      // Arrange
      const action = pending(tool, input);

      // Act
      renderCard(action);

      // Assert
      expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Decline" })).toBeEnabled();
    }
  );

  it.each([
    [
      "the date does not exist",
      "create_workout",
      { description: "Run", date: "2026-02-31" },
    ],
    [
      "the day is not a date",
      "log_health_metric",
      { metric: "sleep", day: "tomorrow", value: 7 },
    ],
    [
      "the data type is unknown",
      "set_data_route",
      { action: "set_source_policy", dataType: "mood", mode: "union" },
    ],
    [
      "the source order holds a non-name",
      "set_data_route",
      {
        action: "set_source_policy",
        dataType: "sleep",
        mode: "priority",
        sourceOrder: ["whoop", null],
      },
    ],
  ])("should treat the input as unreadable when %s", (_case, tool, input) => {
    // Arrange
    const action = pending(tool, input);

    // Act
    renderCard(action);

    // Assert
    expect(screen.getByText(/could not read/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
  });

  it.each([
    ["still being looked up", undefined],
    ["not in the active athlete's library", null],
  ])(
    "should not let a Garmin push be approved while its workout is %s",
    (_case, value) => {
      // Arrange
      label.value = value;

      // Act
      renderCard(pending("push_to_garmin", { workoutId: "w1" }));

      // Assert
      expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    }
  );

  it("should let a Garmin push be approved once its workout is resolved", () => {
    // Arrange
    label.value = { title: "Easy run", duration: "45 min", date: "2026-10-16" };

    // Act
    renderCard(pending("push_to_garmin", { workoutId: "w1" }));

    // Assert
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it("should let a readable action be approved", () => {
    // Arrange
    const action = pending("sync_coaching", {});

    // Act
    renderCard(action);

    // Assert
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });
});
