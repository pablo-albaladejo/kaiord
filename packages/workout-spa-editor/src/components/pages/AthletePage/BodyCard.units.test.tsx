/* eslint-disable no-magic-numbers -- fixtures use literal measurement values for clarity */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { HealthWeightRecord } from "../../../types/health/health-records";
import type { Profile } from "../../../types/profile";
import { BodyCard } from "./BodyCard";

vi.mock("../../../contexts/units-context", () => ({
  useUnits: () => "imperial",
}));

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  bodyWeight: 70,
  height: 175,
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const weighIns = () => db.table<HealthWeightRecord>("healthWeight").toArray();

function renderCard() {
  return renderWithProviders(
    <BodyCard profileId={PROFILE_ID} profile={PROFILE} />,
    { persistence: createDexiePersistence(db) }
  );
}

describe("BodyCard with imperial units", () => {
  beforeEach(async () => {
    await db.table("profiles").clear();
    await db.table("healthWeight").clear();
    await db.table<Profile>("profiles").put(PROFILE);
  });
  afterEach(async () => {
    await db.table("profiles").clear();
    await db.table("healthWeight").clear();
  });

  it("should label and show weight and height in pounds and inches", () => {
    // Arrange
    // Act
    renderCard();

    // Assert
    expect(screen.getByLabelText("Current weight (lb)")).toHaveValue(154.3);
    expect(screen.getByLabelText("Height (in)")).toHaveValue(68.9);
  });

  it("should record a committed pound value as a weigh-in in kilograms", async () => {
    // Arrange
    renderCard();
    const weight = screen.getByLabelText("Current weight (lb)");

    // Act
    await userEvent.clear(weight);
    await userEvent.type(weight, "200");
    await userEvent.tab();

    // Assert
    await waitFor(async () =>
      expect((await weighIns())[0]?.krd.weightKilograms).toBeCloseTo(90.72, 1)
    );
  });
});
