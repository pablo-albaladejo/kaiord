/**
 * The detail view's lifecycle actions against fake-indexeddb, through the
 * real persistence (tombstones included): delete with confirm + Undo, and
 * the keyboard-reachable "Move to another day".
 */
import "fake-indexeddb/auto";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAppPersistence } from "../../../adapters/create-app-persistence";
import { db } from "../../../adapters/dexie/dexie-database";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../contexts/ToastContext";
import type { WorkoutRecord } from "../../../types/calendar-record";
import WorkoutDetail from "./WorkoutDetail";

const ID = "550e8400-e29b-41d4-a716-446655440077";
const navigateMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => [`/workout/view/${ID}`, navigateMock],
  useSearch: () => "",
}));

vi.mock("../../molecules/PushButton", () => ({
  PushButton: () => null,
}));

const record = (): WorkoutRecord =>
  ({
    id: ID,
    profileId: "p1",
    date: "2026-10-05",
    sport: "running",
    source: "scratch",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-10-01T08:00:00.000Z",
  }) as WorkoutRecord;

function Toasts() {
  const { toasts } = useToastContext();
  return toasts.map((toast) => (
    <div key={toast.id} role="status">
      {toast.title}
      {toast.action}
    </div>
  ));
}

const renderDetail = async () => {
  render(
    <PersistenceProvider persistence={createAppPersistence(db)}>
      <ToastContextProvider>
        <WorkoutDetail id={ID} />
        <Toasts />
      </ToastContextProvider>
    </PersistenceProvider>
  );
  await screen.findByTestId("workout-detail-back");
  return userEvent.setup();
};

const stored = () => db.table<WorkoutRecord>("workouts").get(ID);

const openMenuItem = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string
) => {
  await user.click(screen.getByRole("button", { name: "More options" }));
  await user.click(await screen.findByRole("menuitem", { name }));
};

describe("WorkoutDetail lifecycle", () => {
  beforeEach(async () => {
    navigateMock.mockClear();
    await db.table("workouts").clear();
    await db.table("tombstones").clear();
    await db.table("workouts").put(record());
  });

  it("should delete the workout after confirming and restore it with Undo", async () => {
    // Arrange
    const user = await renderDetail();
    await openMenuItem(user, "Delete workout");

    // Act
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(async () => expect(await stored()).toBeUndefined());
    await user.click(await screen.findByRole("button", { name: "Undo" }));

    // Assert
    expect(navigateMock).toHaveBeenCalledWith("/calendar");
    await waitFor(async () => expect(await stored()).toBeDefined());
    const tombstone = await db.table("tombstones").get(["workouts", ID]);
    const restored = await stored();
    expect(Date.parse(restored!.updatedAt)).toBeGreaterThan(
      Date.parse(tombstone.deletedAt)
    );
  });

  it("should keep the workout when the delete is cancelled", async () => {
    // Arrange
    const user = await renderDetail();
    await openMenuItem(user, "Delete workout");

    // Act
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    // Assert
    expect(await stored()).toEqual(record());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("should move the workout to the day picked from the menu", async () => {
    // Arrange
    const user = await renderDetail();
    await openMenuItem(user, "Move to another day");
    const input = await screen.findByTestId("schedule-date-input");
    const initialDate = (input as HTMLInputElement).value;

    // Act
    fireEvent.change(input, { target: { value: "2026-10-09" } });
    await user.click(screen.getByRole("button", { name: "Move" }));

    // Assert
    expect(initialDate).toBe("2026-10-05");
    await waitFor(async () =>
      expect((await stored())?.date).toBe("2026-10-09")
    );
  });
});
