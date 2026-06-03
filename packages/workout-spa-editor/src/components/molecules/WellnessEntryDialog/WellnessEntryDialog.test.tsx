/**
 * WellnessEntryDialog tests.
 *
 * The dialog hosts the entry form + the file-dated import action.
 * Import navigation is exercised through a `memoryLocation` Router so
 * we can assert the target URL carries NO `?date=` (the FIT file dates
 * the imported record, not the clicked day).
 */

import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { PersistencePort } from "../../../ports/persistence-port";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { WellnessEntryDialog } from "./WellnessEntryDialog";

const DAY = "2026-05-04";
const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";

const setup = async (): Promise<PersistencePort> => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.setActiveId(PROFILE_ID);
  return persistence;
};

const renderDialog = (
  persistence: PersistencePort,
  hook: ReturnType<typeof memoryLocation>["hook"],
  onOpenChange = vi.fn()
) =>
  renderWithProviders(
    <Router hook={hook}>
      <WellnessEntryDialog open onOpenChange={onOpenChange} date={DAY} />
    </Router>,
    { persistence }
  );

describe("WellnessEntryDialog", () => {
  it("should include the formatted date in the dialog accessible name", async () => {
    // Arrange
    const persistence = await setup();
    const { hook } = memoryLocation({ path: "/calendar", record: true });

    // Act
    renderDialog(persistence, hook);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /Monday, May 4/i })
      ).toBeInTheDocument();
    });
  });

  it("should enter the FIT import flow without passing a date param", async () => {
    // Arrange
    const persistence = await setup();
    const { hook, history } = memoryLocation({
      path: "/calendar",
      record: true,
    });
    const user = userEvent.setup();
    renderDialog(persistence, hook);

    // Act
    await user.click(screen.getByRole("button", { name: "Import a file" }));

    // Assert
    const target = history[history.length - 1];
    expect(target).toBe("/workout/new?action=import&from=today");
    expect(target).not.toContain("date=");
  });

  it("should expose a focus-trapped dialog reachable by keyboard", async () => {
    // Arrange
    const persistence = await setup();
    const { hook } = memoryLocation({ path: "/calendar", record: true });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderDialog(persistence, hook, onOpenChange);

    // Act
    await waitFor(() => {
      expect(screen.getByTestId("wellness-entry-dialog")).toBeInTheDocument();
    });
    await user.keyboard("{Escape}");

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
