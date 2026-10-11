import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { makeWorkoutRecord } from "../../../application/test-helpers";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { useMoveWorkout } from "./use-move-workout";

const ID = "550e8400-e29b-41d4-a716-446655440088";

const setup = () => {
  const persistence = createInMemoryPersistence();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      <ToastContextProvider>{children}</ToastContextProvider>
    </PersistenceProvider>
  );
  const view = renderHook(
    () => ({ move: useMoveWorkout(), toasts: useToastContext().toasts }),
    { wrapper }
  );
  return { persistence, view };
};

describe("useMoveWorkout", () => {
  it("should move the workout and confirm it", async () => {
    // Arrange
    const { persistence, view } = setup();
    await persistence.workouts.put(makeWorkoutRecord({ id: ID }));

    // Act
    await act(() => view.result.current.move(ID, "2026-10-09"));

    // Assert
    expect((await persistence.workouts.getById(ID))?.date).toBe("2026-10-09");
    expect(view.result.current.toasts.map((t) => t.title)).toEqual([
      "Workout moved",
    ]);
  });

  it("should say the workout no longer exists when it was deleted meanwhile", async () => {
    // Arrange
    const { persistence, view } = setup();

    // Act
    await act(() => view.result.current.move(ID, "2026-10-09"));

    // Assert
    expect(await persistence.workouts.getById(ID)).toBeUndefined();
    expect(view.result.current.toasts).toEqual([
      expect.objectContaining({
        title: "This workout no longer exists.",
        variant: "error",
      }),
    ]);
  });
});
