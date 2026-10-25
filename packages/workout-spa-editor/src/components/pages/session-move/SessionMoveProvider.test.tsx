/**
 * The shared move flow every entry point runs (design §3.8): a same-sport
 * session on the target day asks first, a recording adds the lock sentence,
 * cancelling writes nothing, and a different sport moves without asking.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  coachWorkout,
  PROFILE,
  seedSession,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { useRequestMove } from "../../../contexts/session-move-context";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../contexts/ToastContext";
import type { PersistencePort } from "../../../ports/persistence-port";
import { SessionMoveProvider } from "./SessionMoveProvider";

const MoveButton = () => {
  const requestMove = useRequestMove();
  const { toasts } = useToastContext();
  return (
    <>
      <button type="button" onClick={() => requestMove?.("w", THU)}>
        move
      </button>
      <output>{toasts.map((t) => t.title).join("|")}</output>
    </>
  );
};

const renderFlow = (persistence: PersistencePort) =>
  render(
    <PersistenceProvider persistence={persistence}>
      <ToastContextProvider>
        <SessionMoveProvider>
          <MoveButton />
        </SessionMoveProvider>
      </ToastContextProvider>
    </PersistenceProvider>
  );

const seedWithThursday = async (sport: string) => {
  const persistence = await seedSession({ workout: { sport: "cycling" } });
  await persistence.workouts.put(
    coachWorkout({ id: "thu", date: THU, coachDate: undefined, sport })
  );
  return persistence;
};

const dateOf = async (persistence: PersistencePort) =>
  (await persistence.workouts.getById("w"))?.date;

describe("SessionMoveProvider", () => {
  it("should ask before moving onto a day with the same sport, and write nothing on cancel (AC-13)", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await seedWithThursday("cycling");
    renderFlow(persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "move" }));
    const message = (await screen.findByRole("dialog")).textContent;
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(message).toMatch(
      /There is already a Cycling session on Thu, Oct 8\. Move anyway\?/
    );
    expect(message).not.toMatch(/linked/);
    expect(await dateOf(persistence)).toBe(TUE);
    expect((await persistence.sessionMatch.getById("m"))?.date).toBe(TUE);
  });

  it("should move once the athlete confirms", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await seedWithThursday("cycling");
    renderFlow(persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "move" }));
    await user.click(
      await screen.findByRole("button", { name: "Move anyway" })
    );

    // Assert
    await waitFor(async () => expect(await dateOf(persistence)).toBe(THU));
  });

  it("should add the lock sentence when the same-sport session is a recording (AC-14)", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await seedWithThursday("cycling");
    await persistence.activities.upsertByExternalId({
      id: "act",
      profileId: PROFILE,
      date: THU,
      sport: "cycling",
      sourceBridgeId: "garmin",
      externalId: "ext",
      linkedWorkoutId: "thu",
      krd: null,
      createdAt: "2026-10-01T08:00:00.000Z",
    });
    renderFlow(persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "move" }));

    // Assert
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      /it will be linked to this session and the session will be locked/
    );
  });

  it("should move without asking when the day only holds another sport", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await seedWithThursday("running");
    renderFlow(persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "move" }));

    // Assert
    await waitFor(async () => expect(await dateOf(persistence)).toBe(THU));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should report a workout that no longer exists, on any entry point (2.8)", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await seedSession({ match: null });
    await persistence.workouts.delete("w");
    renderFlow(persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "move" }));

    // Assert
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "This workout no longer exists."
      )
    );
  });

  it("should report a done session as blocked, on any entry point (2.8)", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["rec"] },
    });
    renderFlow(persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "move" }));

    // Assert
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Already done — it can't be moved."
      )
    );
    expect(await dateOf(persistence)).toBe(TUE);
  });
});
