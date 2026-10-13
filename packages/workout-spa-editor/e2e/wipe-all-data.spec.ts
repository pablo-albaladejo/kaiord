/**
 * E2E: Settings → Data & backup → "Delete all my data".
 *
 * The data is real (a profile, a workout and the device's language), the
 * confirmation is typed in the language the UI is in, and what is left
 * afterwards is read from IndexedDB and from the reloaded page itself.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  E2E_DEFAULT_PROFILE_ID,
  makeWorkout,
  seedDefaultProfile,
  seedWorkouts,
} from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

type Row = Record<string, unknown>;

const readTable = (page: Page, table: string): Promise<Row[]> =>
  page.evaluate(async (name) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<unknown[]> };
    };
    return (await db.table(name).toArray()) as Row[];
  }, table);

async function seedAndSwitchToSpanish(page: Page): Promise<void> {
  await page.goto("/settings/general");
  await waitForDexieReady(page);
  await seedDefaultProfile(page);
  await seedWorkouts(page, [makeWorkout({ id: "wipe-me" })]);
  await page
    .getByTestId("settings-preferences")
    .getByRole("radiogroup", { name: "Language" })
    .getByRole("radio", { name: "Spanish" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.goto("/settings/data");
}

test.describe("Delete all my data", () => {
  test("should ask for the typed word, then empty this browser and start over", async ({
    page,
  }) => {
    // Arrange
    await seedAndSwitchToSpanish(page);
    await page.getByRole("button", { name: "Borrar todos mis datos" }).click();
    const dialog = page.getByTestId("wipe-dialog");
    const confirm = dialog.getByRole("button", { name: "Borrar todo" });
    await dialog.getByLabel("Escribe BORRAR para confirmar").fill("BORRA");
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel("Escribe BORRAR para confirmar").fill("BORRAR");

    // Act
    await confirm.click();

    // Assert
    await expect(page).toHaveURL(/#\/calendar\//, { timeout: 15_000 });
    await waitForDexieReady(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await readTable(page, "workouts")).toEqual([]);
    const profiles = await readTable(page, "profiles");
    expect(profiles.map((p) => p.id)).not.toContain(E2E_DEFAULT_PROFILE_ID);
  });

  test("should keep everything when the dialog is cancelled", async ({
    page,
  }) => {
    // Arrange
    await seedAndSwitchToSpanish(page);
    await page.getByRole("button", { name: "Borrar todos mis datos" }).click();
    const dialog = page.getByTestId("wipe-dialog");
    await dialog.getByLabel("Escribe BORRAR para confirmar").fill("BORRAR");

    // Act
    await dialog.getByRole("button", { name: "Cancelar" }).click();

    // Assert
    await expect(dialog).toBeHidden();
    expect(await readTable(page, "workouts")).toHaveLength(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });
});
