/**
 * The Athletes page (audit P-15): the Profile Manager modal is gone, and
 * athletes are created, renamed, made active and deleted on #/athletes. The
 * athlete's own name is renamed in place on #/athlete.
 */

import { expect, test } from "./fixtures/base";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const DEFAULT_NAME = "E2E Default Profile";
const NEW_NAME = "Club U23";

test.describe("Athletes page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/athletes");
    await waitForDexieReady(page);
    await clearDexie(page);
    await page.goto("/athletes");
    await expect(page.getByText("Athletes (1)")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should create, rename, activate and delete an athlete", async ({
    page,
  }) => {
    // Arrange
    const main = page.getByTestId("athletes-page");

    // Act — create
    await main.getByRole("textbox", { name: "Name" }).fill(NEW_NAME);
    await main.getByRole("button", { name: "Create athlete" }).click();

    // Assert
    await expect(main.getByText("Athletes (2)")).toBeVisible();

    // Act — rename in place
    await main.getByRole("button", { name: `Rename ${NEW_NAME}` }).click();
    const field = main.getByRole("textbox", { name: `Rename ${NEW_NAME}` });
    await field.fill("Club U21");
    await field.press("Enter");

    // Assert
    await expect(main.getByText("Club U21", { exact: true })).toBeVisible();

    // Act — make it active
    await main.getByRole("button", { name: "Make Club U21 active" }).click();

    // Assert
    await expect(
      page.getByTestId("status-header-account-button")
    ).toHaveAccessibleName("Account menu (Club U21)");

    // Act — delete the other one, through the confirmation
    await main.getByRole("button", { name: `Delete ${DEFAULT_NAME}` }).click();
    const dialog = page.getByRole("dialog", {
      name: `Delete ${DEFAULT_NAME}?`,
    });
    await dialog.getByRole("button", { name: "Delete athlete" }).click();

    // Assert
    await expect(main.getByText("Athletes (1)")).toBeVisible();
    await expect(main.getByText(DEFAULT_NAME)).toHaveCount(0);
    await expect(
      main.getByRole("button", { name: "Delete Club U21" })
    ).toBeDisabled();
  });

  test("should export an athlete as a JSON file", async ({ page }) => {
    // Arrange
    const download = page.waitForEvent("download");

    // Act
    await page.getByRole("button", { name: `Export ${DEFAULT_NAME}` }).click();

    // Assert
    expect((await download).suggestedFilename()).toBe(
      "athlete-e2e-default-profile.json"
    );
  });

  test("should rename the active athlete in place on the Athlete page", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/athlete");
    await page.getByRole("button", { name: "Rename athlete" }).click();

    // Act
    const field = page.getByRole("textbox", { name: "Athlete name" });
    await field.fill("Pablo");
    await field.press("Enter");

    // Assert
    await expect(page.getByTestId("athlete-identity")).toContainText("Pablo");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
