import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import {
  seedSession,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../contexts/ToastContext";
import type { PersistencePort } from "../../../ports/persistence-port";
import { useGridMove } from "./use-grid-move";

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

const setup = (persistence: PersistencePort) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ToastContextProvider>{children}</ToastContextProvider>
  );
  return renderHook(
    () => ({
      drop: useGridMove(() => persistence),
      toasts: useToastContext().toasts,
    }),
    { wrapper }
  );
};

describe("useGridMove", () => {
  afterEach(async () => {
    await db.table("exportLedger").clear();
  });

  it("should move the dropped session and its match", async () => {
    // Arrange
    const persistence = await seedSession();
    const view = setup(persistence);

    // Act
    act(() => view.result.current.drop("w", THU));

    // Assert
    await waitFor(async () =>
      expect((await persistence.sessionMatch.getById("m"))?.date).toBe(THU)
    );
    expect(view.result.current.toasts).toEqual([]);
  });

  it("should show the blocked toast when a done session is dropped", async () => {
    // Arrange
    const view = setup(
      await seedSession({ match: { executedWorkoutIds: ["rec"] } })
    );

    // Act
    act(() => view.result.current.drop("w", THU));

    // Assert
    await waitFor(() =>
      expect(view.result.current.toasts.map((t) => t.title)).toEqual([
        "Already done — it can't be moved.",
      ])
    );
  });

  it("should show the not-found toast for a missing workout", async () => {
    // Arrange
    const view = setup(await seedSession({ match: null }));

    // Act
    act(() => view.result.current.drop("gone", THU));

    // Assert
    await waitFor(() =>
      expect(view.result.current.toasts.map((t) => t.title)).toEqual([
        "This workout no longer exists.",
      ])
    );
  });

  it("should name the day Garmin still holds and push nothing", async () => {
    // Arrange
    await db.table("exportLedger").put(placedOnTue);
    const view = setup(await seedSession({ workout: { date: TUE } }));

    // Act
    act(() => view.result.current.drop("w", THU));

    // Assert
    await waitFor(() =>
      expect(view.result.current.toasts).toEqual([
        expect.objectContaining({
          title: "Workout moved",
          description: "Garmin still on Tue, Oct 6",
        }),
      ])
    );
    expect(pushTo).not.toHaveBeenCalled();
  });
});
