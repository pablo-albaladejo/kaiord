import "fake-indexeddb/auto";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { useWeekDominantZone } from "./use-week-dominant-zone";

vi.mock("../lib/week-dominant-zone", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const queried = vi.fn();

function Header() {
  const zone = useWeekDominantZone("p1", null);
  queried(zone);
  return <p>header</p>;
}

describe("useWeekDominantZone with a failed classifier import", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await db.table("workouts").clear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should answer null and keep the header mounted", async () => {
    // Arrange
    const ui = <Header />;

    // Act
    render(ui);

    // Assert
    await waitFor(() => expect(queried).toHaveBeenCalledTimes(2));
    expect(screen.getByText("header")).toBeInTheDocument();
    expect(queried).toHaveBeenLastCalledWith(null);
  });
});
