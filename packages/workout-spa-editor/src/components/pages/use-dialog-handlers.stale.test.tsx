/**
 * Skip and unskip write onto the row as stored, not the dialog's snapshot
 * (design §3.10, AC-25, AC-30): a move made after the dialog opened keeps
 * its date, and a row no longer in the expected state is not written.
 */
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { moveSession } from "../../application/move-session";
import {
  NOW,
  seedSession,
  THU,
} from "../../application/session-move.test-fixtures";
import { PersistenceProvider } from "../../contexts/persistence-context";
import type { WorkoutRecord } from "../../types/calendar-record";
import { useDialogHandlers } from "./use-dialog-handlers";

vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));

type Persistence = Awaited<ReturnType<typeof seedSession>>;

const renderHandlers = (persistence: Persistence, opened: WorkoutRecord) =>
  renderHook(() => useDialogHandlers(opened, vi.fn()), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    ),
  });

const moveToThursday = (persistence: Persistence) =>
  moveSession(
    { ...persistence, now: () => NOW },
    { workoutId: "w", targetDay: THU }
  );

describe("useDialogHandlers with a row changed after the dialog opened", () => {
  it("should skip onto the moved date", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const opened = (await persistence.workouts.getById("w"))!;
    await moveToThursday(persistence);
    const { result } = renderHandlers(persistence, opened);

    // Act
    await act(() => result.current.handleSkip("w"));

    // Assert
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      state: "skipped",
    });
  });

  it("should unskip onto the moved date", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "skipped" } });
    const opened = (await persistence.workouts.getById("w"))!;
    await moveToThursday(persistence);
    const { result } = renderHandlers(persistence, opened);

    // Act
    await act(() => result.current.handleUnskip("w"));

    // Assert
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      state: "raw",
    });
  });

  it("should write nothing when the row is no longer raw", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const opened = (await persistence.workouts.getById("w"))!;
    await persistence.workouts.put({ ...opened, state: "structured" });
    const put = vi.spyOn(persistence.workouts, "put");
    const { result } = renderHandlers(persistence, opened);

    // Act
    await act(() => result.current.handleSkip("w"));

    // Assert
    expect(put).not.toHaveBeenCalled();
    expect((await persistence.workouts.getById("w"))?.state).toBe(
      "structured"
    );
  });
});
