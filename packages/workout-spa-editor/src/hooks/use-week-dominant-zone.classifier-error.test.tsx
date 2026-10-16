import "fake-indexeddb/auto";

import { render, screen } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { useWeekDominantZone } from "./use-week-dominant-zone";

vi.mock("../lib/week-dominant-zone", () => ({
  weekDominantZone: () => {
    throw new Error("classifier bug");
  },
}));

class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <p>{this.state.error.message}</p>
    ) : (
      this.props.children
    );
  }
}

function Header() {
  useWeekDominantZone("p1", null);
  return <p>header</p>;
}

describe("useWeekDominantZone with a broken classifier", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await db.table("workouts").clear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should surface a classifier error instead of hiding it as a failed load", async () => {
    // Arrange
    const ui = (
      <Boundary>
        <Header />
      </Boundary>
    );

    // Act
    render(ui);

    // Assert
    expect(await screen.findByText("classifier bug")).toBeInTheDocument();
  });
});
