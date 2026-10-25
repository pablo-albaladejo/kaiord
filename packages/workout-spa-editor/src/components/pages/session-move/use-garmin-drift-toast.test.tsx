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
  seedSession,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
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

  it("should update Garmin from the toast's action and say so", async () => {
    // Arrange
    await db.table("exportLedger").put(placedOn(TUE));
    const persistence = await seedSession({ workout: { date: THU } });
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
      <ToastContextProvider>
        <Harness />
      </ToastContextProvider>
    );
    await act(async () => {
      await notify.current?.("w");
    });

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Update Garmin" })
    );

    // Assert
    expect(pushTo).toHaveBeenCalledWith(
      expect.objectContaining({ id: "w", date: THU })
    );
    expect(await screen.findByText("Garmin updated")).toBeInTheDocument();
  });

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
