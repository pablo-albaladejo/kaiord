/**
 * E2E: Templates is a Capability (GLOSSARY.md, ADR 0003). A new athlete sees
 * no trace of it; activating it from Settings, Capabilities brings back its
 * destination with its templates; deactivating hides it all again and loses
 * nothing; an athlete who already kept templates finds them after the
 * upgrade. Runs in English and Spanish, on the desktop and mobile projects.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { libraryEntry, setCapabilities } from "./helpers/seed-capabilities";
import { clearDexie, makeTemplate, seedTemplates } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

type Words = { library: string; templates: string; capabilities: string };

const ENGLISH: Words = {
  library: "Library",
  templates: "Templates",
  capabilities: "Features",
};
const SPANISH: Words = {
  library: "Biblioteca",
  templates: "Plantillas",
  capabilities: "Funciones",
};

const libraryEntries = (page: Page, words: Words) =>
  libraryEntry(page, words.library);

const templateCount = (page: Page) =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { count: () => Promise<number> };
    };
    return db.table("templates").count();
  });

const freshAthlete = async (page: Page) => {
  await page.goto("/daily");
  await waitForDexieReady(page);
  await clearDexie(page);
};

const expectNoTraceOfTemplates = async (page: Page, words: Words) => {
  await page.goto("/daily");
  await expect(page.getByTestId("daily-page")).toBeVisible();
  await expect(libraryEntries(page, words)).toHaveCount(0);
  await page.goto("/library");
  await expect(page).toHaveURL(/#\/daily$/);
  await expect(page.getByTestId("library-page")).toHaveCount(0);
};

const switchFor = (page: Page, words: Words) =>
  page.getByRole("switch", { name: words.templates });

for (const [language, locale, words] of [
  ["English", "en-US", ENGLISH],
  ["Spanish", "es-ES", SPANISH],
] as const) {
  test.describe(`Templates as a Capability (${language})`, () => {
    test.use({ locale });

    test("should show a new athlete no trace of Templates", async ({
      page,
    }) => {
      // Arrange
      await freshAthlete(page);

      // Act
      await page.goto("/settings");

      // Assert
      await expect(page.getByTestId("settings-row-capabilities")).toContainText(
        words.capabilities
      );
      await expectNoTraceOfTemplates(page, words);
    });

    test("should bring Templates back with its data and hide it again losing nothing", async ({
      page,
    }) => {
      // Arrange
      await freshAthlete(page);
      await seedTemplates(page, [makeTemplate({ name: "Tempo Ride" })]);
      await setCapabilities(page, { templates: false });
      await expectNoTraceOfTemplates(page, words);

      // Act
      await page.goto("/settings/capabilities");
      await switchFor(page, words).click();

      // Assert
      await expect(switchFor(page, words)).toHaveAttribute(
        "aria-checked",
        "true"
      );
      await expect(libraryEntries(page, words)).toHaveCount(1);
      await libraryEntries(page, words).click();
      await expect(page.getByTestId("library-page")).toBeVisible();
      await expect(page.getByText("Tempo Ride", { exact: true })).toBeVisible();

      await page.goto("/settings/capabilities");
      await switchFor(page, words).click();
      await expect(switchFor(page, words)).toHaveAttribute(
        "aria-checked",
        "false"
      );
      await page.reload();
      await expect(switchFor(page, words)).toHaveAttribute(
        "aria-checked",
        "false"
      );
      await expectNoTraceOfTemplates(page, words);
      expect(await templateCount(page)).toBe(1);
    });

    test("should land on the Day for every spelling of the Library's address, and on back and forward", async ({
      page,
    }) => {
      // Arrange
      await freshAthlete(page);
      await seedTemplates(page, [makeTemplate({ name: "Tempo Ride" })]);
      await setCapabilities(page, { templates: true });
      await page.goto("/library");
      await expect(page.getByTestId("library-page")).toBeVisible();
      // In-document navigation, so the browser's history holds the Library.
      await page.evaluate(() => {
        window.location.hash = "#/daily";
      });
      await expect(page.getByTestId("daily-page")).toBeVisible();
      await setCapabilities(page, { templates: false });

      // Act
      await page.goBack();

      // Assert
      await expect(page).toHaveURL(/#\/daily$/);
      await expect(page.getByTestId("library-page")).toHaveCount(0);
      await page.goForward();
      await expect(page).toHaveURL(/#\/daily$/);
      for (const spelling of [
        "/Library",
        "/LIBRARY/x",
        "/library/",
        "/%6Cibrary",
        "/library?view=list",
      ]) {
        await page.goto(spelling);
        await expect(page).toHaveURL(/#\/daily$/);
        await expect(page.getByTestId("library-page")).toHaveCount(0);
      }
    });

    test("should keep Templates on for an athlete who already kept templates", async ({
      page,
    }) => {
      // Arrange
      await freshAthlete(page);
      await seedTemplates(page, [makeTemplate({ name: "Long Run" })]);

      // Act
      await page.goto("/library");

      // Assert
      await expect(page.getByTestId("library-page")).toBeVisible();
      await expect(page.getByText("Long Run", { exact: true })).toBeVisible();
      await expect(libraryEntries(page, words)).toHaveCount(1);
    });
  });
}
