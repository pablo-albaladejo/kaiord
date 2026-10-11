import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { useWorkoutStore } from "../../store/workout-store";
import type { KRD } from "../../types/krd";
import { useBackHandler } from "./use-back-handler";

const DRAFT: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-10-01T00:00:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "Draft",
      sport: "running",
      steps: [{ stepIndex: 0 }],
    },
  },
} as KRD;

const PATH =
  "/workout/new?source=scratch&date=2026-10-05&from=calendar-day&sport=running";

const renderBack = (origin: "calendar-day" | "library") => {
  const loc = memoryLocation({ path: PATH, record: true });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Router hook={loc.hook}>{children}</Router>
  );
  const { result } = renderHook(
    () => useBackHandler("scratch", "2026-10-05", origin, null),
    { wrapper }
  );
  return { back: result.current, loc };
};

describe("useBackHandler", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: DRAFT,
      isModalOpen: false,
      modalConfig: null,
    });
  });

  it("should ask before discarding a sheet-started draft", () => {
    // Arrange
    const { back, loc } = renderBack("calendar-day");

    // Act
    act(() => back?.());

    // Assert
    expect(useWorkoutStore.getState().isModalOpen).toBe(true);
    expect(loc.history.at(-1)).toBe(PATH);
  });

  it("should return a sheet-started draft to the dated sheet once discarded", () => {
    // Arrange
    const { back, loc } = renderBack("calendar-day");

    // Act
    act(() => back?.());
    act(() => useWorkoutStore.getState().modalConfig?.onConfirm());

    // Assert
    expect(useWorkoutStore.getState().currentWorkout).toBeNull();
    expect(loc.history.at(-1)).toBe("/workout/new?date=2026-10-05");
  });

  it("should keep a library-loaded template when going back to the library", () => {
    // Arrange
    const { back, loc } = renderBack("library");

    // Act
    act(() => back?.());

    // Assert
    expect(useWorkoutStore.getState().isModalOpen).toBe(false);
    expect(useWorkoutStore.getState().currentWorkout).toBe(DRAFT);
    expect(loc.history.at(-1)).toBe("/library");
  });
});
