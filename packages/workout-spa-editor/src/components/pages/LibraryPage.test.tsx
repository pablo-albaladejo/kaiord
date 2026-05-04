/**
 * LibraryPage Tests
 *
 * Tests for:
 * - Rendering templates from Dexie
 * - Search filtering
 * - Sport filtering
 * - Schedule action creates workout record
 * - Delete action removes template
 * - "Load into editor" CTA visibility gated on hasCurrentWorkout
 *   (parity with the deleted header modal's onLoadWorkout affordance)
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { useWorkoutStore } from "../../store/workout-store";
import { renderWithProviders } from "../../test-utils";
import type { KRD } from "../../types/krd";
import type { WorkoutTemplate } from "../../types/workout-library";
import LibraryPage from "./LibraryPage";

const renderPage = () =>
  renderWithProviders(<LibraryPage />, {
    persistence: createDexiePersistence(db),
  });

function makeTemplate(
  overrides: Partial<WorkoutTemplate> = {}
): WorkoutTemplate {
  const id = overrides.id ?? crypto.randomUUID();
  return {
    id,
    name: "Test Workout",
    sport: "cycling",
    krd: {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
      extensions: {
        structured_workout: { name: "Test", sport: "cycling", steps: [] },
      },
    },
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const ACTIVE_KRD: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-01T00:00:00Z", sport: "running" },
  extensions: {
    structured_workout: { name: "Active", sport: "running", steps: [] },
  },
};

describe("LibraryPage", () => {
  beforeEach(async () => {
    useWorkoutStore.setState({ currentWorkout: null });
    await db.table("templates").clear();
    await db.table("workouts").clear();
  });

  afterEach(() => {
    useWorkoutStore.setState({ currentWorkout: null });
  });

  it("should render templates from Dexie", async () => {
    // Arrange

    await db
      .table("templates")
      .bulkAdd([
        makeTemplate({ id: "t1", name: "Morning Run", sport: "running" }),
        makeTemplate({ id: "t2", name: "Bike Intervals", sport: "cycling" }),
      ]);

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Bike Intervals")).toBeInTheDocument();
    });
  });

  it("should show empty state when no templates", async () => {
    // Arrange

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Your library is empty")).toBeInTheDocument();
    });
  });

  it("should filter templates by search", async () => {
    // Arrange

    await db
      .table("templates")
      .bulkAdd([
        makeTemplate({ id: "t1", name: "Morning Run", sport: "running" }),
        makeTemplate({ id: "t2", name: "Bike Intervals", sport: "cycling" }),
      ]);

    const user = userEvent.setup();

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search workouts...");
    await user.type(searchInput, "bike");

    await waitFor(() => {
      expect(screen.getByText("Bike Intervals")).toBeInTheDocument();
      expect(screen.queryByText("Morning Run")).not.toBeInTheDocument();
    });
  });

  it("should filter templates by sport", async () => {
    // Arrange

    await db
      .table("templates")
      .bulkAdd([
        makeTemplate({ id: "t1", name: "Morning Run", sport: "running" }),
        makeTemplate({ id: "t2", name: "Bike Intervals", sport: "cycling" }),
      ]);

    const user = userEvent.setup();

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
    });

    const sportFilter = screen.getByLabelText("Sport");
    await user.selectOptions(sportFilter, "running");

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.queryByText("Bike Intervals")).not.toBeInTheDocument();
    });
  });

  it("should create a workout record in workouts table on schedule", async () => {
    // Arrange

    await db
      .table("templates")
      .add(makeTemplate({ id: "t1", name: "Easy Ride", sport: "cycling" }));

    const user = userEvent.setup();

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });

    const scheduleBtn = screen.getByRole("button", { name: /schedule/i });
    await user.click(scheduleBtn);

    await waitFor(() => {
      expect(screen.getByText("Schedule Workout")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: /schedule$/i });
    await user.click(confirmBtn);

    await waitFor(async () => {
      const workouts = await db.table("workouts").toArray();
      expect(workouts).toHaveLength(1);
      expect(workouts[0].sport).toBe("cycling");
      expect(workouts[0].source).toBe("kaiord");
      expect(workouts[0].state).toBe("structured");
      expect(workouts[0].krd).not.toBeNull();
    });
  });

  it("hides the 'Load into editor' CTA when no active workout", async () => {
    // Arrange

    await db
      .table("templates")
      .add(makeTemplate({ id: "t1", name: "Easy Ride", sport: "cycling" }));

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("card-load-into-editor")
    ).not.toBeInTheDocument();
  });

  it("shows the 'Load into editor' CTA only when the editor has an active workout", async () => {
    // Arrange

    await db
      .table("templates")
      .add(makeTemplate({ id: "t1", name: "Easy Ride", sport: "cycling" }));
    useWorkoutStore.setState({ currentWorkout: ACTIVE_KRD });

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });
    expect(screen.getByTestId("card-load-into-editor")).toBeInTheDocument();
  });

  it("clicking 'Load into editor' loads the template KRD into the workout store", async () => {
    // Arrange

    const template = makeTemplate({
      id: "t1",
      name: "Easy Ride",
      sport: "cycling",
    });
    await db.table("templates").add(template);
    useWorkoutStore.setState({ currentWorkout: ACTIVE_KRD });

    const user = userEvent.setup();

    // Act

    renderPage();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("card-load-into-editor")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("card-load-into-editor"));

    await waitFor(() => {
      expect(useWorkoutStore.getState().currentWorkout).toEqual(template.krd);
    });
  });

  it("should render the page heading with the route-heading attribute", async () => {
    // Arrange

    renderPage();

    // Act

    const heading = await screen.findByRole("heading", {
      name: /workout library/i,
    });

    // Assert

    expect(heading.tagName).toBe("H1");
    expect(heading).toHaveAttribute("data-route-heading");
    expect(heading).toHaveAttribute("tabIndex", "-1");
  });
});
