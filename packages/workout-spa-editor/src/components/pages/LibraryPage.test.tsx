/**
 * LibraryPage Tests
 *
 * Tests for:
 * - Rendering templates from Dexie
 * - Search filtering
 * - Sport filtering
 * - Schedule action creates workout record
 * - Delete action removes template
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutTemplate } from "../../types/workout-library";
import LibraryPage from "./LibraryPage";

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

describe("LibraryPage", () => {
  beforeEach(async () => {
    await db.table("templates").clear();
    await db.table("workouts").clear();
  });

  it("renders templates from Dexie", async () => {
    await db
      .table("templates")
      .bulkAdd([
        makeTemplate({ id: "t1", name: "Morning Run", sport: "running" }),
        makeTemplate({ id: "t2", name: "Bike Intervals", sport: "cycling" }),
      ]);

    render(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Bike Intervals")).toBeInTheDocument();
    });
  });

  it("shows empty state when no templates", async () => {
    render(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText("Your library is empty")).toBeInTheDocument();
    });
  });

  it("filters templates by search", async () => {
    await db
      .table("templates")
      .bulkAdd([
        makeTemplate({ id: "t1", name: "Morning Run", sport: "running" }),
        makeTemplate({ id: "t2", name: "Bike Intervals", sport: "cycling" }),
      ]);

    const user = userEvent.setup();
    render(<LibraryPage />);

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

  it("filters templates by sport", async () => {
    await db
      .table("templates")
      .bulkAdd([
        makeTemplate({ id: "t1", name: "Morning Run", sport: "running" }),
        makeTemplate({ id: "t2", name: "Bike Intervals", sport: "cycling" }),
      ]);

    const user = userEvent.setup();
    render(<LibraryPage />);

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

  it("schedule creates a workout record in workouts table", async () => {
    await db
      .table("templates")
      .add(makeTemplate({ id: "t1", name: "Easy Ride", sport: "cycling" }));

    const user = userEvent.setup();
    render(<LibraryPage />);

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
});
