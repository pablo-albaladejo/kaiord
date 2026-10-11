import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { NewWorkoutRoute } from "./new-workout-route";

vi.mock("./lazy-pages", () => ({
  CreateWorkout: ({ onClose }: { onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      close sheet
    </button>
  ),
  EditorPage: () => null,
}));

const closeFrom = async (path: string) => {
  const loc = memoryLocation({ path, record: true });
  render(
    <Router hook={loc.hook}>
      <NewWorkoutRoute />
    </Router>
  );
  await userEvent.click(screen.getByRole("button", { name: "close sheet" }));
  return loc.history.at(-1);
};

describe("NewWorkoutRoute", () => {
  it("should close a dated sheet to the week holding that date", async () => {
    // Arrange
    const sheet = "/workout/new?date=2026-10-05&from=calendar-day";

    // Act
    const landed = await closeFrom(sheet);

    // Assert
    expect(landed).toBe("/calendar/2026-W41");
  });

  it("should close a weeked calendar sheet to its week", async () => {
    // Arrange
    const sheet = "/workout/new?from=calendar&week=2026-W38";

    // Act
    const landed = await closeFrom(sheet);

    // Assert
    expect(landed).toBe("/calendar/2026-W38");
  });

  it("should close a daily sheet back to the daily page", async () => {
    // Arrange
    const sheet = "/workout/new?from=daily";

    // Act
    const landed = await closeFrom(sheet);

    // Assert
    expect(landed).toBe("/daily");
  });
});
