/**
 * Move back from the coach-move notice (design §3.9, AC-18): it names the
 * day the coach replaced, moves the session back through the shared flow,
 * and drops an entry once its workout left the coach's date.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import type { OverriddenSession } from "../../../application/coaching/apply-coach-date-moves";
import {
  coachActivity,
  coachWorkout,
  FRI,
  PROFILE,
  sessionMatch,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { SessionMoveProvider } from "../../pages/session-move/SessionMoveProvider";
import { CoachMoveNotice } from "./CoachMoveNotice";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const persistence = createDexiePersistence(db);

const seed = async (id: string, overrides = {}) => {
  const activityId = `${PROFILE}:train2go:${id}`;
  await persistence.coaching.upsertMany([
    coachActivity({ id: activityId, sourceId: id, date: THU, ...overrides }),
  ]);
  await persistence.workouts.put(
    coachWorkout({ id, date: THU, coachDate: THU, sourceId: id })
  );
  await persistence.sessionMatch.put(
    sessionMatch({
      id: `m-${id}`,
      workoutId: id,
      coachingActivityId: activityId,
      date: THU,
    })
  );
  return { workoutId: id, athleteDate: TUE, coachDate: THU };
};

const renderNotice = (overridden: OverriddenSession[]) =>
  render(
    <PersistenceProvider persistence={persistence}>
      <ToastContextProvider>
        <SessionMoveProvider>
          <CoachMoveNotice
            profileId={PROFILE}
            moves={{
              coachMoves: 0,
              overriddenLocalMoves: overridden.length,
              overridden,
            }}
            onDismiss={vi.fn()}
          />
        </SessionMoveProvider>
      </ToastContextProvider>
    </PersistenceProvider>
  );

const moveBack = (name = "Move back to Tue, Oct 6") =>
  screen.findByRole("button", { name });

describe("CoachMoveNotice Move back", () => {
  beforeEach(async () => {
    await Promise.all(
      ["workouts", "coachingActivities", "sessionMatches"].map((t) =>
        db.table(t).clear()
      )
    );
  });

  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should name the replaced day and move the session back to it", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNotice([await seed("a")]);

    // Act
    await user.click(await moveBack());

    // Assert
    await waitFor(async () =>
      expect((await persistence.workouts.getById("a"))?.date).toBe(TUE)
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Move back/ })
      ).not.toBeInTheDocument()
    );
  });

  it("should list the replaced day before the button", async () => {
    // Arrange
    const entry = await seed("a");

    // Act
    renderNotice([entry]);

    // Assert
    const item = (await moveBack()).closest("li");
    expect(item).toHaveTextContent(
      "The coach moved it to Thu, Oct 8; you had it on Tue, Oct 6."
    );
  });

  it("should name up to three entries and count the rest", async () => {
    // Arrange
    const entries = [];
    for (const id of ["a", "b", "c", "d"]) entries.push(await seed(id));

    // Act
    renderNotice(entries);

    // Assert
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /Move back/ })).toHaveLength(
        entries.length - 1
      )
    );
    expect(screen.getByText("1 more session.")).toBeVisible();
  });

  it("should drop an entry once the session left the coach's date", async () => {
    // Arrange
    renderNotice([await seed("a")]);
    await moveBack();

    // Act
    await persistence.workouts.put(
      coachWorkout({
        id: "a",
        date: "2026-10-07",
        coachDate: THU,
        sourceId: "a",
      })
    );

    // Assert
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Move back/ })).toBeNull()
    );
  });

  it("should show the reason instead of Move back when the session is done", async () => {
    // Arrange
    const entry = await seed("a", { status: "completed" });

    // Act
    renderNotice([entry]);

    // Assert
    const list = await screen.findByRole("list");
    expect(
      within(list).getByText(
        "The coach marked it completed — it can't be moved."
      )
    ).toBeVisible();
    expect(within(list).queryByRole("button")).toBeNull();
  });

  it("should ask first when the athlete's day already holds the same sport", async () => {
    // Arrange
    const user = userEvent.setup();
    const entry = await seed("a");
    await persistence.workouts.put(
      coachWorkout({
        id: "tue",
        date: TUE,
        coachDate: undefined,
        sport: "cycling",
        sourceId: null,
      })
    );
    await persistence.workouts.put(
      coachWorkout({
        id: "a",
        date: THU,
        coachDate: THU,
        sourceId: "a",
        sport: "cycling",
      })
    );
    renderNotice([entry]);

    // Act
    await user.click(await moveBack());

    // Assert
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "There is already a Cycling session on Tue, Oct 6. Move anyway?"
    );
    expect((await persistence.workouts.getById("a"))?.date).toBe(THU);
  });

  it("should speak Spanish when the app does", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";

    // Act
    renderNotice([await seed("a")]);

    // Assert
    const item = (await moveBack("Devolver al mar, 6 oct")).closest("li");
    expect(item).toHaveTextContent(
      "El entrenador la movió al jue, 8 oct; la tenías el mar, 6 oct."
    );
  });

  it("should offer Move back again when a later coach move overrides it (AC-18)", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = renderNotice([await seed("a")]);
    await user.click(await moveBack());
    await waitFor(async () =>
      expect((await persistence.workouts.getById("a"))?.date).toBe(TUE)
    );

    // Act
    await persistence.workouts.put(
      coachWorkout({ id: "a", date: FRI, coachDate: FRI, sourceId: "a" })
    );
    const overridden = [{ workoutId: "a", athleteDate: TUE, coachDate: FRI }];
    rerender(
      <PersistenceProvider persistence={persistence}>
        <ToastContextProvider>
          <SessionMoveProvider>
            <CoachMoveNotice
              profileId={PROFILE}
              moves={{ coachMoves: 0, overriddenLocalMoves: 1, overridden }}
              onDismiss={vi.fn()}
            />
          </SessionMoveProvider>
        </ToastContextProvider>
      </PersistenceProvider>
    );

    // Assert
    expect(await moveBack()).toBeVisible();
  });
});
