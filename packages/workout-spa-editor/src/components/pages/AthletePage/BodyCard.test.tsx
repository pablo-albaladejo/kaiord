import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import { BodyCard } from "./BodyCard";

const WEIGHT = 70;
const HEIGHT = 180;
const MAX_HR = 190;
const OVER_MAX = 300;
const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  bodyWeight: WEIGHT,
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const stored = () => db.table<Profile>("profiles").get(PROFILE_ID);

function renderCard() {
  return renderWithProviders(
    <BodyCard profileId={PROFILE_ID} profile={PROFILE} />,
    { persistence: createDexiePersistence(db) }
  );
}

describe("BodyCard", () => {
  beforeEach(async () => {
    await db.table("profiles").clear();
    await db.table<Profile>("profiles").put(PROFILE);
  });
  afterEach(() => db.table("profiles").clear());

  it("should expose the section anchor and the current values", () => {
    // Arrange
    // Act
    const { container } = renderCard();

    // Assert
    expect(container.querySelector("#body")).not.toBeNull();
    expect(screen.getByLabelText("Body Weight (kg)")).toHaveValue(WEIGHT);
  });

  it("should persist an edited height and show the saved feedback", async () => {
    // Arrange
    renderCard();

    // Act
    await userEvent.type(screen.getByLabelText("Height (cm)"), String(HEIGHT));
    await userEvent.tab();

    // Assert
    await waitFor(async () => expect((await stored())?.height).toBe(HEIGHT));
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("should not persist a numeric field until it is committed", async () => {
    // Arrange
    renderCard();

    // Act
    await userEvent.type(screen.getByLabelText("Height (cm)"), String(HEIGHT));
    const beforeCommit = (await stored())?.height;
    await userEvent.tab();

    // Assert
    expect(beforeCommit).toBeUndefined();
    await waitFor(async () => expect((await stored())?.height).toBe(HEIGHT));
  });

  it("should persist the selected sex and the birth date", async () => {
    // Arrange
    renderCard();

    // Act
    await userEvent.selectOptions(screen.getByLabelText("Sex"), "female");
    await userEvent.type(screen.getByLabelText("Birth Date"), "1990-05-17");

    // Assert
    await waitFor(async () => {
      const saved = await stored();
      expect(saved?.sex).toBe("female");
      expect(saved?.birthDate).toBe("1990-05-17");
    });
  });

  it("should persist the max heart rate as profile.maxHeartRate", async () => {
    // Arrange
    renderCard();

    // Act
    await userEvent.type(
      screen.getByLabelText("Max Heart Rate (bpm)"),
      `${MAX_HR}{Enter}`
    );

    // Assert
    await waitFor(async () =>
      expect((await stored())?.maxHeartRate).toBe(MAX_HR)
    );
  });

  it("should reject a max heart rate above 250 instead of saving it", async () => {
    // Arrange
    renderCard();

    // Act
    await userEvent.type(
      screen.getByLabelText("Max Heart Rate (bpm)"),
      `${OVER_MAX}{Enter}`
    );

    // Assert
    expect(await screen.findByText(/between 1 and 250/i)).toBeInTheDocument();
    expect((await stored())?.maxHeartRate).not.toBe(OVER_MAX);
  });
});
