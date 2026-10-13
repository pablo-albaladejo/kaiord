import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { HealthWeightRecord } from "../../../types/health/health-records";
import type { Profile } from "../../../types/profile";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { BodyCard } from "./BodyCard";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const PROFILE_KG = 72.5;
const WEIGH_IN_KG = 71.9;
const EDITED_KG = 70.4;
const RE_EDITED_KG = 70.1;
const LABEL = "Current weight (kg)";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  bodyWeight: PROFILE_KG,
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const weighIns = () => db.table<HealthWeightRecord>("healthWeight").toArray();

const seedWeighIn = (date: string, kg: number) =>
  db.table<HealthWeightRecord>("healthWeight").put({
    id: `w-${date}`,
    profileId: PROFILE_ID,
    date,
    krd: {
      kind: "weight",
      version: "2.0",
      measuredAt: `${date}T07:00:00.000Z`,
      weightKilograms: kg,
    },
  });

const renderCard = () =>
  renderWithProviders(<BodyCard profileId={PROFILE_ID} profile={PROFILE} />, {
    persistence: createDexiePersistence(db),
  });

const typeWeight = async (kg: number) => {
  const field = screen.getByLabelText(LABEL);
  await userEvent.clear(field);
  await userEvent.type(field, `${kg}{Enter}`);
};

describe("BodyCard current weight", () => {
  beforeEach(async () => {
    await db.table("profiles").clear();
    await db.table("healthWeight").clear();
    await db.table<Profile>("profiles").put(PROFILE);
  });
  afterEach(async () => {
    await db.table("profiles").clear();
    await db.table("healthWeight").clear();
  });

  it("should show the latest weigh-in instead of the profile weight", async () => {
    // Arrange
    await seedWeighIn("2026-01-05", WEIGH_IN_KG);

    // Act
    renderCard();

    // Assert
    await waitFor(() =>
      expect(screen.getByLabelText(LABEL)).toHaveValue(WEIGH_IN_KG)
    );
  });

  it("should fall back to the profile weight when there is no weigh-in", () => {
    // Arrange
    // Act
    renderCard();

    // Assert
    expect(screen.getByLabelText(LABEL)).toHaveValue(PROFILE_KG);
  });

  it("should record an edited weight as today's weigh-in", async () => {
    // Arrange
    renderCard();

    // Act
    await typeWeight(EDITED_KG);

    // Assert
    await waitFor(async () => {
      const rows = await weighIns();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.date).toBe(todayIsoDate());
      expect(rows[0]?.krd.weightKilograms).toBe(EDITED_KG);
    });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(
      (await db.table<Profile>("profiles").get(PROFILE_ID))?.bodyWeight
    ).toBe(PROFILE_KG);
  });

  it("should update today's weigh-in on a same-day re-edit", async () => {
    // Arrange
    renderCard();
    await typeWeight(EDITED_KG);
    await waitFor(async () => expect(await weighIns()).toHaveLength(1));

    // Act
    await typeWeight(RE_EDITED_KG);

    // Assert
    await waitFor(async () => {
      const rows = await weighIns();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.krd.weightKilograms).toBe(RE_EDITED_KG);
    });
  });
});
