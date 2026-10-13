/**
 * Connections page with NO Kaiord extension — the Playwright default, since
 * browsers run without extension runtimes. The page must say what is missing
 * once, offer the install action, and not repeat a paragraph on every card.
 */
import { expect, test } from "./fixtures/base";
import { seedDefaultProfile } from "./helpers/seed-profile";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const ROUTE = "/settings/connections";
const BRIDGE_CARDS = ["garmin", "train2go", "whoop", "tanita", "trainingpeaks"];
const INSTALL = "Install Kaiord extension";

test.describe("Connections without the Kaiord extension", () => {
  test("should show one banner and an install action on every extension card", async ({
    page,
  }) => {
    // Arrange
    await page.goto(ROUTE);
    await waitForDexieReady(page);
    await seedDefaultProfile(page);

    // Act
    await page.goto(ROUTE);

    // Assert — the banner waits for the discovery window, so it appears once.
    const banner = page.getByTestId("connections-extension-banner");
    await expect(banner).toBeVisible({ timeout: 20_000 });
    await expect(banner.getByRole("link", { name: INSTALL })).toHaveAttribute(
      "href",
      /kaiord\.com\/docs\/bridges/
    );
    for (const id of BRIDGE_CARDS) {
      const card = page.getByTestId(`connection-card-${id}`);
      await expect(card).toContainText("Requires the Kaiord extension");
      await expect(card.getByRole("link", { name: INSTALL })).toBeVisible();
    }
    await expect(page.getByText(/not running in this browser/i)).toHaveCount(0);
  });
});
