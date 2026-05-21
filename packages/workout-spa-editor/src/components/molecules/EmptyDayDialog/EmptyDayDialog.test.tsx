import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { addTemplate } from "../../../application/library/add-template";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { EmptyDayDialog } from "./EmptyDayDialog";

const makeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
});

function renderWithRouter(ui: React.ReactNode, path = "/calendar") {
  const loc = memoryLocation({ path, record: true });
  return {
    ...renderWithProviders(<Router hook={loc.hook}>{ui}</Router>, {
      persistence: createDexiePersistence(db),
    }),
    location: loc,
  };
}

const PROFILE_ID = "00000000-0000-4000-8000-0000000000e1";

describe("EmptyDayDialog", () => {
  beforeEach(async () => {
    await db.table("templates").clear();
    await db.table("workouts").clear();
    await db.table("profiles").clear();
    await db.table("meta").clear();
    await db.table("profiles").put({
      id: PROFILE_ID,
      name: "Tester",
      sportZones: {},
      linkedAccounts: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
  });

  it("should render dialog when date is provided (open)", () => {
    // Arrange

    // Act

    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    // Assert

    expect(screen.getByTestId("empty-day-dialog")).toBeInTheDocument();
    expect(screen.getByText("Add workout")).toBeInTheDocument();
  });

  it("should not render dialog content when date is null (closed)", () => {
    // Arrange

    // Act

    renderWithRouter(<EmptyDayDialog date={null} onClose={vi.fn()} />);

    // Assert

    expect(screen.queryByTestId("empty-day-dialog")).not.toBeInTheDocument();
  });

  it("should show formatted date label", () => {
    // Arrange

    // Act

    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    // Assert

    expect(screen.getByText(/Saturday, March 15/)).toBeInTheDocument();
  });

  it("should render Add from Library button", () => {
    // Arrange

    // Act

    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    // Assert

    expect(screen.getByText("Add from Library")).toBeInTheDocument();
  });

  it("should render Create new workout button", () => {
    // Arrange

    // Act

    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    // Assert

    expect(screen.getByText("Create new workout")).toBeInTheDocument();
  });

  it("should open TemplatePickerDialog (does not navigate) on Add from Library", async () => {
    // Arrange

    const user = userEvent.setup();
    const onClose = vi.fn();
    const { location } = renderWithRouter(
      <EmptyDayDialog date="2025-03-15" onClose={onClose} />
    );

    // Act

    await user.click(screen.getByText("Add from Library"));

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("template-picker-dialog")).toBeInTheDocument();
    });
    // No navigation away from the calendar.
    expect(location.history).not.toContain("/library");
    // Empty-day dialog stays mounted while picker is open so the
    // user can cancel and pick "Create new workout" without a re-open.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should not show the page-level ScheduleDateDialog during the in-flow flow", async () => {
    // Arrange

    const user = userEvent.setup();
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    // Act

    await user.click(screen.getByText("Add from Library"));

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("template-picker-dialog")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("dialog", { name: /schedule workout/i })
    ).not.toBeInTheDocument();
  });

  it("should schedule the picked template for the dialog's date and close both dialogs", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    const template = await addTemplate(
      persistence,
      "Tempo Ride",
      "cycling",
      makeKrd()
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={onClose} />);

    // Act

    await user.click(screen.getByText("Add from Library"));

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Tempo Ride"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    const workouts = await db.table("workouts").toArray();
    expect(workouts).toHaveLength(1);
    expect(workouts[0].date).toBe("2025-03-15");
    expect(workouts[0].krd).toEqual(template.krd);
    expect(
      screen.queryByTestId("template-picker-dialog")
    ).not.toBeInTheDocument();
  });

  it("should fire toast.error and not persist when no active profile is set on pick", async () => {
    // Arrange

    await db.table("meta").clear();
    const persistence = createDexiePersistence(db);
    await addTemplate(persistence, "Tempo Ride", "cycling", makeKrd());
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={onClose} />);

    // Act

    await user.click(screen.getByText("Add from Library"));
    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Tempo Ride"));

    // Assert

    await waitFor(() => {
      expect(screen.getByText("No active profile")).toBeInTheDocument();
    });
    const workouts = await db.table("workouts").toArray();
    expect(workouts).toHaveLength(0);
  });

  it("should navigate to new workout with date and closes on Create click", async () => {
    // Arrange

    const user = userEvent.setup();
    const onClose = vi.fn();
    const { location } = renderWithRouter(
      <EmptyDayDialog date="2025-03-15" onClose={onClose} />
    );

    // Act

    await user.click(screen.getByText("Create new workout"));

    // Assert

    expect(onClose).toHaveBeenCalledOnce();
    expect(location.history).toContain(
      "/workout/new?source=scratch&date=2025-03-15"
    );
  });
});
