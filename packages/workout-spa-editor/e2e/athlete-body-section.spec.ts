/**
 * Audit P-02: the personal data that unlocks Daily's energy card lives in a
 * "Body" section on /athlete, reachable by deep link from the gated card.
 */

import { expect, test } from "./fixtures/base";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

test.describe("Athlete Body section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/athlete");
    await waitForDexieReady(page);
    await clearDexie(page);
  });

  test("unlocks Daily's energy card from the gated card's deep link", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/daily");
    const gated = page.getByTestId("energy-balance-gated");
    await expect(gated).toBeVisible();

    // Act
    await gated.click();
    const body = page.locator("#body");
    await expect(body).toBeVisible();
    await expect(body).toBeFocused();
    await expect(body).toBeInViewport();
    await body.getByLabel("Body Weight (kg)").fill("72");
    await body.getByLabel("Height (cm)").fill("178");
    await body.getByLabel("Birth Date").fill("1990-05-17");
    await body.getByLabel("Sex").selectOption("male");
    await expect(body.getByRole("status")).toHaveText("Saved");
    await page.goto("/daily");

    // Assert
    await expect(page.getByTestId("energy-balance-card")).toBeVisible();
    await expect(page.getByTestId("energy-balance-gated")).toHaveCount(0);
  });
});
