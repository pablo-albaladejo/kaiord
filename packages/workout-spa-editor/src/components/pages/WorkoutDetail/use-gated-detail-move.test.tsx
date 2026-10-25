/**
 * The detail's Move runs the same-sport check like every other entry point
 * (design §3.8, AC-13): a same-sport target day waits for confirmation.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  coachWorkout,
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
import { useGatedDetailMove } from "./use-gated-detail-move";

const setup = async (thursdaySport: string) => {
  const persistence = await seedSession({ workout: { sport: "cycling" } });
  await persistence.workouts.put(
    coachWorkout({
      id: "thu",
      date: THU,
      coachDate: undefined,
      sport: thursdaySport,
    })
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      <ToastContextProvider>{children}</ToastContextProvider>
    </PersistenceProvider>
  );
  const view = renderHook(
    () => ({ move: useGatedDetailMove(), toasts: useToastContext().toasts }),
    { wrapper }
  );
  return { persistence, view };
};

const dateOf = async (persistence: PersistencePort) =>
  (await persistence.workouts.getById("w"))?.date;

describe("useGatedDetailMove", () => {
  it("should hold a move onto a same-sport day until confirmed", async () => {
    // Arrange
    const { persistence, view } = await setup("cycling");

    // Act
    act(() => view.result.current.move.request("w", THU));

    // Assert
    await waitFor(() =>
      expect(view.result.current.move.pending?.day).toBe(THU)
    );
    expect(await dateOf(persistence)).toBe(TUE);
  });

  it("should move and confirm once the athlete agrees", async () => {
    // Arrange
    const { persistence, view } = await setup("cycling");
    act(() => view.result.current.move.request("w", THU));
    await waitFor(() =>
      expect(view.result.current.move.pending).not.toBeNull()
    );

    // Act
    act(() => view.result.current.move.confirm());

    // Assert
    await waitFor(async () => expect(await dateOf(persistence)).toBe(THU));
    await waitFor(() =>
      expect(view.result.current.toasts.map((t) => t.title)).toEqual([
        "Workout moved",
      ])
    );
  });

  it("should move without asking onto a day of another sport", async () => {
    // Arrange
    const { persistence, view } = await setup("running");

    // Act
    act(() => view.result.current.move.request("w", THU));

    // Assert
    await waitFor(async () => expect(await dateOf(persistence)).toBe(THU));
    expect(view.result.current.move.pending).toBeNull();
  });
});
