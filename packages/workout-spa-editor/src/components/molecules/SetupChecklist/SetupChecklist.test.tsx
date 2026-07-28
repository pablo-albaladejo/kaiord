/**
 * Card-level test. `useSetupChecklist` is mocked so each rendering rule
 * (progress caption, next-action highlight, dismiss wiring, the two hidden
 * states) is asserted independently of Dexie; the hook's own state derivation
 * is covered by `hooks/use-setup-checklist.test.tsx`.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { SetupChecklist as SetupChecklistState } from "../../../hooks/use-setup-checklist";
import { buildSetupChecklistItems } from "../../../lib/setup-checklist";
import { renderWithProviders } from "../../../test-utils";
import { SetupChecklist } from "./SetupChecklist";

const useSetupChecklist = vi.hoisted(() => vi.fn());

vi.mock("../../../hooks/use-setup-checklist", () => ({ useSetupChecklist }));

const dismiss = vi.fn();

const stateWith = (
  done: [boolean, boolean, boolean, boolean],
  overrides: Partial<SetupChecklistState> = {}
): SetupChecklistState => {
  const items = buildSetupChecklistItems({
    hasWorkout: done[0],
    hasThreshold: done[1],
    hasSource: done[2],
    hasPush: done[3],
  });
  const doneCount = items.filter((item) => item.done).length;
  return {
    items,
    doneCount,
    total: items.length,
    complete: doneCount === items.length,
    dismissed: false,
    dismiss,
    ...overrides,
  };
};

const renderCard = () => {
  const { hook } = memoryLocation({ path: "/daily", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <SetupChecklist />
    </Router>
  );
};

describe("SetupChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the title and the done-of-total progress caption", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([true, true, false, false]));

    // Act
    renderCard();

    // Assert
    expect(screen.getByText("Getting set up")).toBeInTheDocument();
    expect(screen.getByText("2 of 4 done")).toBeInTheDocument();
  });

  it("should expose the progress bar with item counts, not percent", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([true, true, false, false]));

    // Act
    renderCard();

    // Assert
    const bar = screen.getByRole("progressbar", { name: "Setup progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
  });

  it("should render every item title", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([false, false, false, false]));

    // Act
    renderCard();

    // Assert
    expect(screen.getByText("Create your first workout")).toBeInTheDocument();
    expect(screen.getByText("Set your FTP and zones")).toBeInTheDocument();
    expect(screen.getByText("Connect a source")).toBeInTheDocument();
    expect(
      screen.getByText("Push a session to your watch")
    ).toBeInTheDocument();
  });

  it("should highlight the first not-done item as the next action with its hint", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([true, true, false, false]));

    // Act
    renderCard();

    // Assert
    expect(
      screen.getByText("Garmin, Train2Go or WHOOP — 2 minutes")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Open a planned session and send it to your device")
    ).not.toBeInTheDocument();
  });

  it("should link the next action to the surface that completes it", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([false, false, false, false]));

    // Act
    renderCard();

    // Assert
    expect(
      screen.getByTestId("setup-checklist-link-create-workout")
    ).toHaveAttribute("href", "/workout/new?from=daily");
  });

  it("should render done items as inert text, not as links", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([true, false, false, false]));

    // Act
    renderCard();

    // Assert
    expect(
      screen.queryByTestId("setup-checklist-link-create-workout")
    ).not.toBeInTheDocument();
  });

  it("should call dismiss when the close control is pressed", async () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([false, false, false, false]));
    renderCard();

    // Act
    await userEvent.click(screen.getByTestId("setup-checklist-dismiss"));

    // Assert
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("should render nothing when the checklist was dismissed", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(
      stateWith([false, false, false, false], { dismissed: true })
    );

    // Act
    renderCard();

    // Assert
    expect(screen.queryByTestId("setup-checklist")).not.toBeInTheDocument();
  });

  it("should render nothing once every item is done", () => {
    // Arrange
    useSetupChecklist.mockReturnValue(stateWith([true, true, true, true]));

    // Act
    renderCard();

    // Assert
    expect(screen.queryByTestId("setup-checklist")).not.toBeInTheDocument();
  });
});
