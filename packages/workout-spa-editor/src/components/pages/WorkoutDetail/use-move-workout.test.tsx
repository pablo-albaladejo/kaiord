import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import {
  seedSession,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
import { makeWorkoutRecord } from "../../../application/test-helpers";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { useMoveWorkout } from "./use-move-workout";

const placedOnTue = {
  id: "row-w",
  kaiordRecordId: "w",
  destinationBridgeId: "garmin-bridge",
  dataType: "workout",
  destinationExternalId: "101",
  contentHash: "h",
  exportedAt: "2026-10-01T08:00:00.000Z",
  placement: {
    kind: "scheduled",
    workoutScheduleId: "202",
    workoutId: "101",
    date: TUE,
  },
};

const pushTo = vi.fn();

vi.mock("../../molecules/GarminPushButton/useGarminPush", () => ({
  useGarminPushTo: () => pushTo,
}));

const ID = "550e8400-e29b-41d4-a716-446655440088";

const setup = (persistence = createInMemoryPersistence()) => {
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
  afterEach(async () => {
    await db.table("exportLedger").clear();
  });

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

  it("should show the blocked toast and not rethrow when the session is done", async () => {
    // Arrange
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["rec"] },
    });
    const { view } = setup(persistence);

    // Act
    await act(() => view.result.current.move("w", THU));

    // Assert
    expect(view.result.current.toasts).toEqual([
      expect.objectContaining({
        title: "Already done — it can't be moved.",
        variant: "error",
      }),
    ]);
  });

  it("should name the coach when a completed session is refused", async () => {
    // Arrange
    const persistence = await seedSession({
      activity: { status: "completed" },
    });
    const { view } = setup(persistence);

    // Act
    await act(() => view.result.current.move("w", THU));

    // Assert
    expect(view.result.current.toasts.map((t) => t.title)).toEqual([
      "The coach marked it completed — it can't be moved.",
    ]);
  });

  it("should name the day Garmin still holds instead of confirming, and push nothing", async () => {
    // Arrange
    await db.table("exportLedger").put(placedOnTue);
    const { view } = setup(await seedSession({ workout: { date: TUE } }));

    // Act
    await act(() => view.result.current.move("w", THU));

    // Assert
    expect(view.result.current.toasts).toEqual([
      expect.objectContaining({
        title: "Workout moved",
        description: "Garmin still on Tue, Oct 6",
      }),
    ]);
    expect(pushTo).not.toHaveBeenCalled();
  });
});
