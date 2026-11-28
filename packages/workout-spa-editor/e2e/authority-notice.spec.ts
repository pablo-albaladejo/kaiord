/**
 * E2E: one notice when the Authority changes (ADR 0003, "decide and offer
 * undo"). An athlete whose weight TrainingPeaks decided connects Tanita: the
 * App says once that Tanita now decides their weight and that days only
 * TrainingPeaks reported don't change, with one link to the weight row on
 * Connections, and no dialog. It is remembered on the athlete, so a reload
 * does not repeat it, and an athlete who chose Tanita in the matrix is never
 * told. English and Spanish.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { setCapabilities } from "./helpers/seed-capabilities";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000d7";

/** Long enough for the App to have read the athlete and decided to say nothing. */
const SETTLE_MS = 1_500;

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    get: (k: string) => Promise<Record<string, unknown> | undefined>;
  };
};

const ENGLISH =
  "Tanita now decides: Weight. Days only TrainingPeaks reported don't change.";
const SPANISH =
  "Tanita decide ahora: Peso. Los días que solo informó TrainingPeaks no cambian.";

const putWeightRoute = (page: Page, bridgeId: string) =>
  page.evaluate(
    async ({ pid, bridgeId }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      await db.table("integrationPolicies").put({
        id: crypto.randomUUID(),
        profileId: pid,
        dataType: "weight",
        bridgeId,
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: new Date().toISOString(),
      });
    },
    { pid: PROFILE_ID, bridgeId }
  );

const told = (page: Page) =>
  page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    const prefs = await db.table("userPreferences").get(pid);
    return prefs?.authorityDeciders as Record<string, string[]> | undefined;
  }, PROFILE_ID);

/** An athlete whose weight TrainingPeaks has decided for months. */
const seedTrainingPeaksWeight = async (page: Page) => {
  await page.goto("/daily");
  await waitForDexieReady(page);
  await clearDexie(page);
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Notice E2E",
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
    await db.table("meta").put({ key: "activeProfileId", value: pid });
    await db.table("userPreferences").put({
      profileId: pid,
      calendarView: "grid",
      authorityDeciders: { weight: ["trainingpeaks"] },
      updatedAt: now,
    });
  }, PROFILE_ID);
  await putWeightRoute(page, "trainingpeaks-bridge");
};

/** The athlete connects once the App reads in their language. */
const openDay = async (page: Page, calendar: string) => {
  await page.goto("/daily");
  await expect(
    page.getByText(calendar, { exact: true }).first()
  ).toBeAttached();
};

for (const [language, locale, sentence, calendar] of [
  ["English", "en-US", ENGLISH, "Calendar"],
  ["Spanish", "es-ES", SPANISH, "Calendario"],
] as const) {
  test.describe(`Authority notice (${language})`, () => {
    test.use({ locale });

    test("should say once that Tanita now decides the weight and link to its row", async ({
      page,
    }) => {
      // Arrange
      await seedTrainingPeaksWeight(page);
      await openDay(page, calendar);

      // Act: the athlete connects Tanita, which starts sending weight.
      await putWeightRoute(page, "tanita-bridge");

      // Assert: one notice, no dialog, one link to the weight row.
      await expect(page.getByText(sentence).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect
        .poll(() => told(page))
        .toEqual({ weight: ["trainingpeaks", "tanita"] });
      await page.getByTestId("authority-notice-change").click();
      await expect(page).toHaveURL(/\/connections\?kind=weight$/);
      await expect(page.getByTestId("routing-row-weight")).toBeFocused();
      await expect(page.getByTestId("routing-from-weight")).toHaveText(
        "Tanita"
      );

      // Assert: remembered on the athlete, so a reload says nothing.
      await page.goto("/daily");
      await expect(page.getByTestId("authority-notice-change")).toHaveCount(0);
      await page.waitForTimeout(SETTLE_MS);
      await expect(page.getByText(sentence)).toHaveCount(0);
    });

    test("should never tell an athlete who chose Tanita in the matrix", async ({
      page,
    }) => {
      // Arrange
      await seedTrainingPeaksWeight(page);
      await setCapabilities(page, { "authority-matrix": true });
      await page.evaluate(async (pid) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as DexieDb;
        await db.table("dataTypeSourcePolicy").put({
          profileId: pid,
          dataType: "weight",
          mode: "priority",
          sourceOrder: ["tanita-bridge"],
        });
      }, PROFILE_ID);
      await openDay(page, calendar);

      // Act
      await putWeightRoute(page, "tanita-bridge");

      // Assert
      await expect
        .poll(() => told(page))
        .toEqual({ weight: ["trainingpeaks", "tanita"] });
      await page.waitForTimeout(SETTLE_MS);
      await expect(page.getByText(sentence)).toHaveCount(0);
    });
  });
}
