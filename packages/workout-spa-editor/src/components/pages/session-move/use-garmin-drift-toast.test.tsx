/**
 * After a move, a workout Garmin still holds on the old day gets a toast
 * naming that day, with Update Garmin; nothing is pushed until it is pressed
 * (design §3.11 "After a move", AC-19, AC-20).
 */
import "fake-indexeddb/auto";

import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import {
  ACTIVITY_ID,
  FRI,
  seedSession,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../contexts/ToastContext";
import type { PersistencePort } from "../../../ports/persistence-port";
import { useGarminDriftToast } from "./use-garmin-drift-toast";

const pushTo = vi.fn(async (): Promise<PlacementResult | undefined> => ({
  kind: "moved",
}));

vi.mock("../../molecules/GarminPushButton/useGarminPush", () => ({
  useGarminPushTo: () => pushTo,
}));

const placedOn = (date: string) => ({
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
    date,
  },
});

const setup = (persistence: PersistencePort) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ToastContextProvider>{children}</ToastContextProvider>
  );
  return renderHook(
    () => ({
      notify: useGarminDriftToast(() => persistence),
      toasts: useToastContext().toasts,
    }),
    { wrapper }
  );
};

/** Renders the toasts with their actions, inside the app's providers. */
const showToastWithAction = async (persistence: PersistencePort) => {
  const notify: { current?: (id: string) => Promise<boolean> } = {};
  function Harness() {
    notify.current = useGarminDriftToast(() => persistence);
    const { toasts } = useToastContext();
    return (
      <ul>
        {toasts.map((t) => (
          <li key={t.id}>
            {t.title}
            {t.action}
          </li>
        ))}
      </ul>
    );
  }
  render(
    <PersistenceProvider persistence={persistence}>
      <ToastContextProvider>
        <Harness />
      </ToastContextProvider>
    </PersistenceProvider>
  );
  await act(async () => {
    await notify.current?.("w");
  });
};

describe("useGarminDriftToast", () => {
  beforeEach(async () => {
    pushTo.mockClear();
    await db.table("exportLedger").clear();
  });

  it("should name the Garmin day after a move and push nothing on its own", async () => {
    // Arrange
    await db.table("exportLedger").put(placedOn(TUE));
    const view = setup(await seedSession({ workout: { date: THU } }));

    // Act
    let shown = false;
    await act(async () => {
      shown = await view.result.current.notify("w");
    });

    // Assert
    expect(shown).toBe(true);
    expect(view.result.current.toasts).toEqual([
      expect.objectContaining({
        title: "Workout moved",
        description: "Garmin still on Tue, Oct 6",
      }),
    ]);
    expect(pushTo).not.toHaveBeenCalled();
  });

  it("should push the row as stored at the press, not as it was at the move", async () => {
    // Arrange
    await db.table("exportLedger").put(placedOn(TUE));
    const persistence = await seedSession({ workout: { date: THU } });
    await showToastWithAction(persistence);
    const moved = await persistence.workouts.getById("w");
    await persistence.workouts.put({ ...moved!, date: FRI, name: "Edited" });

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Update Garmin" })
    );

    // Assert
    expect(pushTo).toHaveBeenCalledTimes(1);
    expect(pushTo).toHaveBeenCalledWith(
      expect.objectContaining({ id: "w", date: FRI, name: "Edited" })
    );
    expect(await screen.findByText("Garmin updated")).toBeInTheDocument();
  });

  it.each([
    ["the workout was deleted", (p: PersistencePort) => p.workouts.delete("w")],
    [
      "the coach completed the session",
      async (p: PersistencePort) => {
        const activity = await p.coaching.getById(ACTIVITY_ID);
        await p.coaching.put({ ...activity!, status: "completed" });
      },
    ],
  ])(
    "should push nothing and say nothing when %s before the press",
    async (_label, change) => {
      // Arrange
      await db.table("exportLedger").put(placedOn(TUE));
      const persistence = await seedSession({ workout: { date: THU } });
      await showToastWithAction(persistence);
      await change(persistence);

      // Act
      await userEvent.click(
        screen.getByRole("button", { name: "Update Garmin" })
      );

      // Assert
      await act(async () => {});
      expect(pushTo).not.toHaveBeenCalled();
      expect(screen.queryByText("Garmin updated")).toBeNull();
      expect(screen.queryByText(/Garmin was not updated/)).toBeNull();
    }
  );

  it.each([
    ["Garmin already holds the new day", placedOn(THU)],
    ["the workout was never sent", undefined],
  ])("should stay silent when %s", async (_label, row) => {
    // Arrange
    if (row) await db.table("exportLedger").put(row);
    const view = setup(await seedSession({ workout: { date: THU } }));

    // Act
    let shown = true;
    await act(async () => {
      shown = await view.result.current.notify("w");
    });

    // Assert
    expect(shown).toBe(false);
    expect(view.result.current.toasts).toEqual([]);
  });
});
