/**
 * E2E: Kaiord picks the Authority by itself (GLOSSARY.md "Authority", ADR
 * 0003 "decide and offer undo"). An athlete with TrainingPeaks and Tanita
 * both sending weight is never asked which one decides: Connections names
 * Tanita, chosen by Kaiord. The matrix to choose by hand is an advanced
 * Capability: absent until activated, its choice overrides Kaiord's while it
 * is on, and turning it off hides it, keeps the choice and lets Kaiord decide
 * again. Runs in English and Spanish, on the desktop and mobile projects.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { setCapabilities } from "./helpers/seed-capabilities";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000d1";

type Words = {
  chosenByKaiord: string;
  matrix: string;
  section: string;
  automatic: string;
};

const ENGLISH: Words = {
  chosenByKaiord: "chosen by Kaiord",
  matrix: "Choose which Platform decides",
  section: "Which Platform decides",
  automatic: "Automatic",
};
const SPANISH: Words = {
  chosenByKaiord: "elegida por Kaiord",
  matrix: "Elegir qué Plataforma decide",
  section: "Qué Plataforma decide",
  automatic: "Automático",
};

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    toArray: () => Promise<unknown[]>;
  };
};

/** A new athlete who connected TrainingPeaks, then Tanita, for weight. */
const seedTwoPlatforms = async (page: Page) => {
  await page.goto("/daily");
  await waitForDexieReady(page);
  await clearDexie(page);
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Authority E2E",
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
    await db.table("meta").put({ key: "activeProfileId", value: pid });
    await db
      .table("userPreferences")
      .put({ profileId: pid, calendarView: "grid", updatedAt: now });
    for (const bridgeId of ["trainingpeaks-bridge", "tanita-bridge"]) {
      await db.table("integrationPolicies").put({
        id: crypto.randomUUID(),
        profileId: pid,
        dataType: "weight",
        bridgeId,
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: now,
      });
    }
  }, PROFILE_ID);
};

const weightFrom = (page: Page) => page.getByTestId("routing-from-weight");

const openConnections = async (page: Page) => {
  await page.goto("/connections");
  await expect(page.getByTestId("data-type-routing")).toBeVisible({
    timeout: 15_000,
  });
};

const storedChoices = (page: Page) =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    return db.table("dataTypeSourcePolicy").toArray();
  });

for (const [language, locale, words] of [
  ["English", "en-US", ENGLISH],
  ["Spanish", "es-ES", SPANISH],
] as const) {
  test.describe(`Automatic Authority (${language})`, () => {
    test.use({ locale });

    test("should never ask a new athlete with two Platforms which one decides", async ({
      page,
    }) => {
      // Arrange
      await seedTwoPlatforms(page);

      // Act
      await openConnections(page);
      await page.getByTestId("routing-change-weight").click();

      // Assert
      await expect(weightFrom(page)).toHaveText("Tanita");
      await expect(page.getByTestId("routing-note-weight")).toContainText(
        words.chosenByKaiord
      );
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page.locator('[data-testid^="routing-choice-"]')
      ).toHaveCount(0);
      await expect(page.getByTestId("authority-matrix-link")).toHaveCount(0);
      await page.goto("/settings");
      await expect(page.getByTestId("settings-row-authority")).toHaveCount(0);
      expect(await storedChoices(page)).toEqual([]);
    });

    test("should let the matrix override Kaiord while on and leave no trace when off", async ({
      page,
    }) => {
      // Arrange
      await seedTwoPlatforms(page);
      const matrixSwitch = page.getByRole("switch", { name: words.matrix });

      // Act: activate the matrix and choose TrainingPeaks for weight.
      await page.goto("/settings/capabilities");
      await matrixSwitch.click();
      await expect(matrixSwitch).toHaveAttribute("aria-checked", "true");
      await page.goto("/settings");
      await expect(page.getByTestId("settings-row-authority")).toContainText(
        words.section
      );
      await page.getByTestId("settings-row-authority").click();
      await expect(
        page.getByTestId("authority-choice-weight-automatic")
      ).toHaveText(words.automatic);
      await expect(
        page.getByTestId("authority-choice-weight-automatic")
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByTestId("authority-choice-weight-trainingpeaks-bridge")
        .click();

      // Assert: the choice overrides Kaiord's.
      await expect(
        page.getByTestId("authority-choice-weight-trainingpeaks-bridge")
      ).toHaveAttribute("aria-pressed", "true");
      await openConnections(page);
      await expect(weightFrom(page)).toHaveText("TrainingPeaks");
      await expect(page.getByTestId("authority-matrix-link")).toBeVisible();

      // Act: turn the matrix off.
      await page.goto("/settings/capabilities");
      await matrixSwitch.click();
      await expect(matrixSwitch).toHaveAttribute("aria-checked", "false");

      // Assert: no trace, Kaiord decides again, the choice is kept.
      await openConnections(page);
      await expect(weightFrom(page)).toHaveText("Tanita");
      await expect(page.getByTestId("authority-matrix-link")).toHaveCount(0);
      await page.goto("/settings");
      await expect(page.getByTestId("settings-group-list")).toBeVisible();
      await expect(page.getByTestId("settings-row-authority")).toHaveCount(0);
      await page.goto("/settings/authority");
      await expect(page.getByTestId("settings-authority")).toHaveCount(0);
      expect(await storedChoices(page)).toHaveLength(1);
    });

    test("should keep an existing athlete's choice on after the update", async ({
      page,
    }) => {
      // Arrange
      await seedTwoPlatforms(page);
      await page.evaluate(async (pid) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as DexieDb;
        await db.table("dataTypeSourcePolicy").put({
          profileId: pid,
          dataType: "weight",
          mode: "priority",
          sourceOrder: ["trainingpeaks-bridge"],
        });
      }, PROFILE_ID);

      // Act
      await openConnections(page);

      // Assert
      await expect(weightFrom(page)).toHaveText("TrainingPeaks");
      await expect(page.getByTestId("authority-matrix-link")).toBeVisible();
      await setCapabilities(page, { "authority-matrix": false });
      await expect(weightFrom(page)).toHaveText("Tanita");
    });
  });
}
