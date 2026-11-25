import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { AthleteNoteField } from "./AthleteNoteField";

const COMPOSITE = "p1:train2go:42";

const setup = (persistence = createInMemoryPersistence()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  render(<AthleteNoteField profileId="p1" activityId="train2go:42" />, {
    wrapper,
  });
  return persistence;
};

describe("AthleteNoteField", () => {
  it("should save the athlete's note for the Coaching Activity under Your note", async () => {
    // Arrange
    const persistence = setup();
    const user = userEvent.setup();

    // Act
    await user.type(
      screen.getByRole("textbox", { name: "Your note" }),
      "on the trainer"
    );
    await user.click(screen.getByRole("button", { name: "Save note" }));

    // Assert
    await waitFor(async () =>
      expect((await persistence.athleteNotes.getById(COMPOSITE))?.text).toBe(
        "on the trainer"
      )
    );
  });

  it("should show a saved note and clear it", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.athleteNotes.put({
      id: COMPOSITE,
      profileId: "p1",
      text: "skip the single-leg part",
      updatedAt: "2026-11-25T10:00:00.000Z",
    });
    setup(persistence);
    const user = userEvent.setup();
    const box = await screen.findByDisplayValue("skip the single-leg part");

    // Act
    await user.click(screen.getByRole("button", { name: "Clear note" }));

    // Assert
    await waitFor(async () =>
      expect((await persistence.athleteNotes.getById(COMPOSITE))?.text).toBe("")
    );
    expect(box).toHaveValue("");
  });

  it("should offer Save only once the note changed", async () => {
    // Arrange
    setup();

    // Act
    const save = screen.getByRole("button", { name: "Save note" });

    // Assert
    expect(save).toBeDisabled();
  });
});
